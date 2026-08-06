import Foundation

class APIService {
    static let shared = APIService()
    let baseURL = "https://clearlease-weld.vercel.app"

    func validateLease(text: String) async throws -> (isLease: Bool, reason: String) {
        let url = URL(string: "\(baseURL)/api/validate")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 15

        let body = ["text": String(text.prefix(3000))]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            return (isLease: true, reason: "Validation unavailable")
        }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return (isLease: true, reason: "Validation unavailable")
        }

        let isLease = json["isLease"] as? Bool ?? true
        let reason = json["reason"] as? String ?? "Could not determine document type."
        return (isLease: isLease, reason: reason)
    }

    func analyzeText(leaseText: String, state: String) async throws -> Analysis {
        let url = URL(string: "\(baseURL)/api/analyze")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = ["leaseText": leaseText, "state": state]
        request.httpBody = try JSONEncoder().encode(body)

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(Analysis.self, from: data)
    }

    func chat(messages: [[String: String]], clauseText: String, state: String) async throws -> String {
        let url = URL(string: "\(baseURL)/api/chat")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "messages": messages,
            "clauseText": clauseText,
            "state": state
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode([String: String].self, from: data)
        return response["reply"] ?? "No response"
    }
}
