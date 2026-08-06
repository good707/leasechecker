import SwiftUI

struct ClauseChatView: View {
    let flag: Flag
    let state: String
    let onClose: () -> Void

    @State private var messages: [ChatMessage] = []
    @State private var input = ""
    @State private var isLoading = false

    let suggested = [
        "Can my landlord actually do this?",
        "Is this negotiable?",
        "What happens if I ignore this?"
    ]

    var body: some View {
        ZStack {
            Color("appBackground").ignoresSafeArea()

            VStack(spacing: 0) {

                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Clause Chat")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(Color("appTextPrimary"))
                        Text("\"\(flag.clause_text.prefix(50))...\"")
                            .font(.system(size: 11))
                            .foregroundColor(Color("appTextDim"))
                            .italic()
                            .lineLimit(1)
                    }
                    Spacer()
                    Button {
                        onClose()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 13))
                            .foregroundColor(Color("appTextSecondary"))
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
                .background(Color("appSurface"))
                .overlay(
                    Rectangle()
                        .fill(Color("appBorder"))
                        .frame(height: 0.5),
                    alignment: .bottom
                )

                // Messages
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(spacing: 12) {
                            if messages.isEmpty {
                                VStack(spacing: 10) {
                                    Text("ASK ANYTHING ABOUT THIS CLAUSE")
                                        .font(.system(size: 9))
                                        .foregroundColor(Color("appTextDim"))
                                        .tracking(1.5)
                                        .padding(.top, 24)

                                    ForEach(suggested, id: \.self) { q in
                                        Button {
                                            Task { await send(q) }
                                        } label: {
                                            Text(q)
                                                .font(.system(size: 13))
                                                .foregroundColor(Color("appTextSecondary"))
                                                .frame(maxWidth: .infinity, alignment: .leading)
                                                .padding(.horizontal, 16)
                                                .padding(.vertical, 12)
                                                .background(Color("appSurfaceRow"))
                                                .cornerRadius(10)
                                                .overlay(
                                                    RoundedRectangle(cornerRadius: 10)
                                                        .stroke(Color("appBorder"), lineWidth: 0.5)
                                                )
                                        }
                                    }
                                }
                                .padding(.horizontal, 16)
                            }

                            ForEach(messages) { message in
                                HStack {
                                    if message.role == "user" { Spacer() }
                                    Text(message.content)
                                        .font(.system(size: 13))
                                        .foregroundColor(message.role == "user"
                                                         ? Color("appTextPrimary")
                                                         : Color("appTextSecondary"))
                                        .lineSpacing(4)
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 10)
                                        .background(message.role == "user"
                                                     ? Color("appSurface")
                                                     : Color("appSurfaceRow"))
                                        .cornerRadius(14)
                                        .frame(maxWidth: UIScreen.main.bounds.width * 0.75,
                                               alignment: message.role == "user" ? .trailing : .leading)
                                    if message.role == "assistant" { Spacer() }
                                }
                                .id(message.id)
                            }

                            if isLoading {
                                HStack {
                                    Text("Thinking...")
                                        .font(.system(size: 13))
                                        .foregroundColor(Color("appTextDim"))
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 10)
                                        .background(Color("appSurfaceRow"))
                                        .cornerRadius(14)
                                    Spacer()
                                }
                            }
                        }
                        .padding(16)
                        .onChange(of: messages.count) { _ in
                            if let last = messages.last {
                                proxy.scrollTo(last.id, anchor: .bottom)
                            }
                        }
                    }
                }

                // Input
                HStack(spacing: 10) {
                    TextField("Ask a follow-up...", text: $input)
                        .font(.system(size: 13))
                        .foregroundColor(Color("appTextPrimary"))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        .background(Color("appSurfaceRow"))
                        .cornerRadius(10)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color("appBorder"), lineWidth: 0.5)
                        )

                    Button {
                        Task { await send(input) }
                    } label: {
                        Text("Send")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(Color("appTextSecondary"))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                            .background(Color("appSurface"))
                            .cornerRadius(10)
                    }
                    .disabled(input.trimmingCharacters(in: .whitespaces).isEmpty || isLoading)
                    .opacity(input.trimmingCharacters(in: .whitespaces).isEmpty ? 0.4 : 1)
                }
                .padding(16)
                .background(Color("appBackground"))
                .overlay(
                    Rectangle()
                        .fill(Color("appBorder"))
                        .frame(height: 0.5),
                    alignment: .top
                )
            }
        }
    }

    func send(_ text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        input = ""
        messages.append(ChatMessage(role: "user", content: trimmed))
        isLoading = true
        let apiMessages = messages.map { ["role": $0.role, "content": $0.content] }
        do {
            let reply = try await APIService.shared.chat(
                messages: apiMessages,
                clauseText: flag.clause_text,
                state: state
            )
            messages.append(ChatMessage(role: "assistant", content: reply))
        } catch {
            messages.append(ChatMessage(role: "assistant", content: "Something went wrong. Try again."))
        }
        isLoading = false
    }
}
