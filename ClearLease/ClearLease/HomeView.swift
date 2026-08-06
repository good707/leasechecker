import SwiftUI
import UniformTypeIdentifiers
import PhotosUI
import Vision
import PDFKit

struct HomeView: View {
    @Binding var selectedState: String
    @Binding var errorMessage: String
    let states: [(String, String)]
    let onUpload: (String) -> Void

    @State private var showFilePicker = false
    @State private var showPhotoPicker = false
    @State private var showCamera = false
    @State private var photoItem: PhotosPickerItem? = nil

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {

                // Header
                VStack(spacing: 8) {
                    Text("ClearLease")
                        .font(.custom("Georgia", size: 36))
                        .foregroundColor(Color("appTextPrimary"))
                    Text("Understand your lease. Know your rights.")
                        .font(.system(size: 14))
                        .foregroundColor(Color("appTextSecondary"))
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 64)
                .padding(.bottom, 32)
                .padding(.horizontal, 24)

                // Main card
                VStack(spacing: 20) {

                    // State picker
                    VStack(alignment: .leading, spacing: 10) {
                        Text("YOUR STATE")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color("appTextSecondary"))
                            .tracking(1.5)

                        Menu {
                            ForEach(states, id: \.0) { code, name in
                                Button(name) {
                                    selectedState = code
                                    errorMessage = ""
                                }
                            }
                        } label: {
                            HStack {
                                Text(selectedState.isEmpty
                                     ? "Select your state..."
                                     : states.first(where: { $0.0 == selectedState })?.1 ?? "")
                                    .font(.system(size: 16))
                                    .foregroundColor(selectedState.isEmpty
                                                     ? Color("appTextSecondary")
                                                     : Color("appAccent"))
                                Spacer()
                                Image(systemName: "chevron.down")
                                    .font(.system(size: 13))
                                    .foregroundColor(selectedState.isEmpty
                                                     ? Color("appTextDim")
                                                     : Color("appAccent"))
                            }
                            .padding(.horizontal, 18)
                            .padding(.vertical, 16)
                            .background(Color("appBackground"))
                            .cornerRadius(14)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(selectedState.isEmpty
                                            ? Color("appBorder")
                                            : Color("appAccent").opacity(0.5),
                                            lineWidth: 1.5)
                            )
                        }
                    }

                    Rectangle()
                        .fill(Color("appBorder"))
                        .frame(height: 1)

                    // Upload options
                    VStack(alignment: .leading, spacing: 10) {
                        Text("UPLOAD YOUR LEASE")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color("appTextSecondary"))
                            .tracking(1.5)

                        VStack(spacing: 10) {
                            uploadRow(
                                icon: "doc.fill",
                                iconBg: "appIconGreen",
                                iconColor: "appIconGreenText",
                                title: "Upload Document",
                                subtitle: "PDF or text file · iCloud · Google Drive"
                            )  {
                                if selectedState.isEmpty {
                                    errorMessage = "Please select your state first."
                                } else {
                                    errorMessage = ""
                                    showFilePicker = true
                                }
                            }

                            uploadRow(
                                icon: "camera.fill",
                                iconBg: "appIconPurple",
                                iconColor: "appIconPurpleText",
                                title: "Take a Photo",
                                subtitle: "Photograph your lease pages"
                            ) {
                                if selectedState.isEmpty {
                                    errorMessage = "Please select your state first."
                                } else {
                                    errorMessage = ""
                                    showCamera = true
                                }
                            }

                            uploadRow(
                                icon: "photo.fill",
                                iconBg: "appIconOrange",
                                iconColor: "appIconOrangeText",
                                title: "Choose from Photos",
                                subtitle: "Select existing photos from library"
                            ){
                                if selectedState.isEmpty {
                                    errorMessage = "Please select your state first."
                                } else {
                                    errorMessage = ""
                                    showPhotoPicker = true
                                }
                            }
                        }
                    }

                    // Error
                    if !errorMessage.isEmpty {
                        HStack(spacing: 10) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.system(size: 14))
                            Text(errorMessage)
                                .font(.system(size: 13))
                        }
                        .foregroundColor(Color(hex: "ff6666"))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(Color(hex: "2a1a1a"))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(hex: "aa3333"), lineWidth: 1)
                        )
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding(20)
                .background(Color("appSurface"))
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color("appBorder"), lineWidth: 1)
                )
                .padding(.horizontal, 16)

                Text("Your lease is analyzed privately and never stored")
                    .font(.system(size: 12))
                    .foregroundColor(Color("appTextDim"))
                    .padding(.top, 20)
                    .padding(.bottom, 40)
            }
        }
        .fileImporter(
            isPresented: $showFilePicker,
            allowedContentTypes: [.pdf, .plainText],
            allowsMultipleSelection: false
        ) { result in
            handleFilePick(result: result)
        }
        .photosPicker(
            isPresented: $showPhotoPicker,
            selection: $photoItem,
            matching: .images
        )
        .onChange(of: photoItem) { newItem in
            Task { await handlePhotoItem(newItem) }
        }
        .sheet(isPresented: $showCamera) {
            CameraView { image in
                showCamera = false
                Task { await handleCameraImage(image) }
            }
        }
    }

    @ViewBuilder
    func uploadRow(
        icon: String,
        iconBg: String,
        iconColor: String,
        title: String,
        subtitle: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(iconBg))
                        .frame(width: 50, height: 50)
                    Image(systemName: icon)
                        .font(.system(size: 22))
                        .foregroundColor(Color(iconColor))
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(Color("appTextPrimary"))
                    Text(subtitle)
                        .font(.system(size: 12))
                        .foregroundColor(Color("appTextDim"))
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13))
                    .foregroundColor(Color("appTextDim"))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Color("appSurfaceRow"))
            .cornerRadius(14)
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color("appBorder"), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .opacity(selectedState.isEmpty ? 0.5 : 1)
    }

    func handleFilePick(result: Result<[URL], Error>) {
        do {
            let urls = try result.get()
            guard let url = urls.first else { return }
            guard url.startAccessingSecurityScopedResource() else { return }
            defer { url.stopAccessingSecurityScopedResource() }
            let ext = url.pathExtension.lowercased()
            if ext == "pdf" {
                guard let pdf = PDFDocument(url: url) else {
                    errorMessage = "Could not open PDF."
                    return
                }
                var fullText = ""
                for i in 0..<pdf.pageCount {
                    fullText += pdf.page(at: i)?.string ?? ""
                    fullText += "\n"
                }
                if fullText.trimmingCharacters(in: .whitespaces).isEmpty {
                    errorMessage = "PDF appears scanned. Try taking a photo instead."
                    return
                }
                onUpload(fullText)
            } else {
                let text = try String(contentsOf: url, encoding: .utf8)
                onUpload(text)
            }
        } catch {
            errorMessage = "Could not read file."
        }
    }

    func handlePhotoItem(_ item: PhotosPickerItem?) async {
        guard let item = item else { return }
        do {
            guard let data = try await item.loadTransferable(type: Data.self),
                  let image = UIImage(data: data),
                  let cgImage = image.cgImage else {
                await MainActor.run { errorMessage = "Could not load image." }
                return
            }
            await runOCR(on: cgImage)
        } catch {
            await MainActor.run { errorMessage = "Could not read image." }
        }
    }

    func handleCameraImage(_ image: UIImage) async {
        guard let cgImage = image.cgImage else {
            await MainActor.run { errorMessage = "Could not process photo." }
            return
        }
        await runOCR(on: cgImage)
    }

    func runOCR(on cgImage: CGImage) async {
        let handler = VNImageRequestHandler(cgImage: cgImage)
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true
        do {
            try handler.perform([request])
            let text = request.results?
                .compactMap { $0.topCandidates(1).first?.string }
                .joined(separator: "\n") ?? ""
            if text.trimmingCharacters(in: .whitespaces).isEmpty {
                await MainActor.run {
                    errorMessage = "No text found. Make sure the lease is clearly visible."
                }
                return
            }
            onUpload(text)
        } catch {
            await MainActor.run { errorMessage = "OCR failed. Try a clearer photo." }
        }
    }
}
