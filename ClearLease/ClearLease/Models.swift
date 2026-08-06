import Foundation

struct Flag: Codable, Identifiable {
    var id = UUID()
    let clause_text: String
    let severity: Int
    let category: String
    let plain_english: String
    let what_to_do: String
    let illegal_in_state: Bool

    enum CodingKeys: String, CodingKey {
        case clause_text, severity, category, plain_english, what_to_do, illegal_in_state
    }
}

struct Analysis: Codable {
    let fairness_score: Int
    let summary: String
    let flags: [Flag]
    let positives: [String]
}

struct ChatMessage: Identifiable {
    let id = UUID()
    let role: String
    let content: String
}
