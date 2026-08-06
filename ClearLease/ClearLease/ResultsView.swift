import SwiftUI

struct ResultsView: View {
    let analysis: Analysis
    let state: String
    let onReset: () -> Void

    var scoreColor: Color {
        if analysis.fairness_score >= 70 { return Color(hex: "44cc88") }
        if analysis.fairness_score >= 45 { return Color(hex: "FFE500") }
        return Color(hex: "ff6666")
    }

    var scoreLabel: String {
        if analysis.fairness_score >= 70 { return "Looks Fair" }
        if analysis.fairness_score >= 45 { return "Some Concerns" }
        return "High Risk"
    }

    var body: some View {
        ZStack {
            Color("appBackground").ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {

                    // Header
                    VStack(spacing: 6) {
                        Text("ClearLease")
                            .font(.custom("Georgia", size: 26))
                            .foregroundColor(Color("appTextPrimary"))
                        Text(state)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color("appTextSecondary"))
                            .tracking(2)
                    }
                    .padding(.top, 56)
                    .padding(.bottom, 28)

                    // Score card
                    VStack(spacing: 12) {
                        Text("\(analysis.fairness_score)")
                            .font(.custom("Georgia", size: 88))
                            .foregroundColor(scoreColor)

                        Text(scoreLabel.uppercased())
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(scoreColor.opacity(0.7))
                            .tracking(2)

                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(Color("appBorder"))
                                    .frame(height: 6)
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(scoreColor)
                                    .frame(width: geo.size.width * CGFloat(analysis.fairness_score) / 100, height: 6)
                            }
                        }
                        .frame(height: 6)
                        .padding(.horizontal, 32)

                        Text("Fairness Score out of 100")
                            .font(.system(size: 12))
                            .foregroundColor(Color("appTextDim"))
                    }
                    .padding(.vertical, 28)
                    .padding(.horizontal, 20)
                    .background(Color("appSurface"))
                    .cornerRadius(20)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(Color("appBorder"), lineWidth: 1)
                    )
                    .padding(.horizontal, 16)

                    // Summary
                    Text(analysis.summary)
                        .font(.system(size: 15))
                        .foregroundColor(Color("appTextSecondary"))
                        .lineSpacing(6)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 24)

                    Rectangle()
                        .fill(Color("appSurface"))
                        .frame(height: 1)
                        .padding(.horizontal, 16)

                    // Flags
                    if !analysis.flags.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("⚠️")
                                Text("FLAGGED CLAUSES (\(analysis.flags.count))")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(Color("appTextSecondary"))
                                    .tracking(1.5)
                            }
                            .padding(.horizontal, 16)
                            .padding(.top, 24)

                            ForEach(analysis.flags) { flag in
                                FlagCard(flag: flag, state: state)
                                    .padding(.horizontal, 16)
                            }
                        }
                    }

                    // Positives
                    if !analysis.positives.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("✅")
                                Text("WHAT THE LANDLORD GOT RIGHT")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(Color("appTextSecondary"))
                                    .tracking(1.5)
                            }
                            .padding(.horizontal, 16)
                            .padding(.top, 24)

                            ForEach(analysis.positives, id: \.self) { positive in
                                HStack(alignment: .top, spacing: 12) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 18))
                                        .foregroundColor(Color(hex: "44cc88"))
                                    Text(positive)
                                        .font(.system(size: 14))
                                        .foregroundColor(Color("appTextSecondary"))
                                        .lineSpacing(4)
                                }
                                .padding(.horizontal, 16)
                            }
                        }
                        .padding(.bottom, 24)
                    }

                    Button {
                        onReset()
                    } label: {
                        Text("← Analyze Another Lease")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(Color("appAccent"))
                            .padding(.vertical, 16)
                    }
                    .padding(.bottom, 32)
                }
            }
        }
    }
}

struct FlagCard: View {
    let flag: Flag
    let state: String
    @State private var showChat = false

    var sevColor: Color {
        if flag.severity >= 8 { return Color(hex: "ff6666") }
        if flag.severity >= 5 { return Color(hex: "FFE500") }
        return Color(hex: "44cc88")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {

            HStack(spacing: 8) {
                Text("Severity \(flag.severity)/10")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(sevColor)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(sevColor.opacity(0.15))
                    .cornerRadius(20)

                Text(flag.category.uppercased())
                    .font(.system(size: 10))
                    .foregroundColor(Color("appTextDim"))
                    .tracking(1)

                Spacer()

                if flag.illegal_in_state {
                    Text("ILLEGAL IN \(state)")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Color(hex: "ff6666"))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(hex: "ff6666").opacity(0.15))
                        .cornerRadius(20)
                }
            }

            Text("\"\(flag.clause_text)\"")
                .font(.system(size: 12))
                .foregroundColor(Color("appTextDim"))
                .italic()
                .lineSpacing(4)
                .padding(.leading, 12)
                .overlay(
                    Rectangle()
                        .fill(sevColor.opacity(0.5))
                        .frame(width: 2),
                    alignment: .leading
                )

            Text(flag.plain_english)
                .font(.system(size: 15))
                .foregroundColor(Color("appTextPrimary"))
                .lineSpacing(5)

            VStack(alignment: .leading, spacing: 6) {
                Text("What to do")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(Color("appTextSecondary"))
                Text(flag.what_to_do)
                    .font(.system(size: 13))
                    .foregroundColor(Color("appTextSecondary"))
                    .lineSpacing(4)
            }
            .padding(14)
            .background(Color("appSurfaceRow"))
            .cornerRadius(12)

            Button {
                showChat = true
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "bubble.left.fill")
                        .font(.system(size: 13))
                    Text("Ask about this clause")
                        .font(.system(size: 13, weight: .medium))
                }
                .foregroundColor(Color(hex: "aa88ff"))
                .padding(.vertical, 4)
            }
        }
        .padding(18)
        .background(Color("appSurface"))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(sevColor.opacity(0.3), lineWidth: 1)
        )
        .sheet(isPresented: $showChat) {
            ClauseChatView(flag: flag, state: state) {
                showChat = false
            }
        }
    }
}
