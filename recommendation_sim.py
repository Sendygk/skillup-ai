import numpy as np

def cosine_similarity(v1, v2):
    """Calculates cosine similarity between two dictionaries representing vectors."""
    keys = set(v1.keys()) & set(v2.keys())
    dot_product = sum(v1[k] * v2[k] for k in keys)
    
    mag1 = np.sqrt(sum(val**2 for val in v1.values()))
    mag2 = np.sqrt(sum(val**2 for val in v2.values()))
    
    if mag1 == 0 or mag2 == 0:
        return 0
    return dot_product / (mag1 * mag2)

# Sample Data (Based on SkillUp AI Domain Model)
domain_model = [
    {"id": "basic_speaking", "title": "Basic Public Speaking", "req": {"confidence": 0.8, "articulation": 0.2, "fillers": 0.8}},
    {"id": "voice_intonation", "title": "Voice & Intonation", "req": {"confidence": 0.5, "articulation": 0.8, "fillers": 0.4}},
    {"id": "filler_reduction", "title": "Filler Word Reduction", "req": {"confidence": 0.5, "articulation": 0.9, "fillers": 1.0}}
]

# Sample Student Performance (Scale 0-1)
# High fillers (0.9) means many filler words detected
student_performance = {"confidence": 0.3, "articulation": 0.4, "fillers": 0.9}

# Calculate Weakness Vector (What they NEED to improve)
weakness_vector = {
    "confidence": 1 - student_performance["confidence"],
    "articulation": 1 - student_performance["articulation"],
    "fillers": student_performance["fillers"] # Higher is worse, so higher need
}

print(f"Student Weakness Vector: {weakness_vector}\n")

# Recommendations
recommendations = []
for module in domain_model:
    score = cosine_similarity(weakness_vector, module["req"])
    recommendations.append({"title": module["title"], "score": score})

# Sort by highest similarity
recommendations.sort(key=lambda x: x["score"], reverse=True)

print("Top Recommended Modules:")
for i, rec in enumerate(recommendations, 1):
    print(f"{i}. {rec['title']} (Match Score: {rec['score']:.4f})")
