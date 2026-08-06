import SwiftUI

struct ContentView: View {
    @State private var selectedState = ""
    @State private var analysis: Analysis? = nil
    @State private var isLoading = false
    @State private var errorMessage = ""

    let states = [
        ("CA", "California"),
        ("NY", "New York"),
        ("TX", "Texas"),
        ("FL", "Florida"),
        ("IL", "Illinois")
    ]

    var body: some View {
        ZStack {
            Color("appBackground")
                .ignoresSafeArea()

            if isLoading {
                LoadingView()
            } else if let analysis = analysis {
                ResultsView(
                    analysis: analysis,
                    state: selectedState,
                    onReset: {
                        self.analysis = nil
                        self.selectedState = ""
                    }
                )
            } else {
                HomeView(
                    selectedState: $selectedState,
                    errorMessage: $errorMessage,
                    states: states,
                    onUpload: { text in
                        Task { await analyze(leaseText: text) }
                    }
                )
            }
        }
    }

    func analyze(leaseText: String) async {
        guard !selectedState.isEmpty else {
            errorMessage = "Please select your state first."
            return
        }
        isLoading = true
        errorMessage = ""
        do {
            let validation = try await APIService.shared.validateLease(text: leaseText)
            guard validation.isLease else {
                await MainActor.run {
                    errorMessage = "❌ This doesn't look like a lease. \(validation.reason)"
                    isLoading = false
                }
                return
            }
            let result = try await APIService.shared.analyzeText(
                leaseText: leaseText,
                state: selectedState
            )
            await MainActor.run {
                analysis = result
                isLoading = false
            }
        } catch {
            await MainActor.run {
                errorMessage = "Something went wrong: \(error.localizedDescription)"
                isLoading = false
            }
        }
    }
}
