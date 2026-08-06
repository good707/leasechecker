import SwiftUI

struct LoadingView: View {
    @State private var opacity = 0.4

    var body: some View {
        VStack(spacing: 20) {
            Text("⚖️")
                .font(.system(size: 64))
                .opacity(opacity)
                .animation(
                    Animation.easeInOut(duration: 1.0).repeatForever(autoreverses: true),
                    value: opacity
                )
                .onAppear { opacity = 1.0 }

            Text("Analyzing your lease...")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(Color("appTextPrimary"))

            Text("This takes 10–20 seconds")
                .font(.system(size: 14))
                .foregroundColor(Color("appTextSecondary"))
        }
    }
}
