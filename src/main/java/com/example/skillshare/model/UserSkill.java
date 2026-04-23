package com.example.skillshare.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "user_skills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    @ToString.Exclude
    private User user;

    private String skillName;

    // Based on user feedback: "Beginner", "Intermediate", "Advanced"
    private String proficiencyLevel;
    
    /**
     * Helper to compute a numeric score for sorting purposes.
     * Advanced = 3, Intermediate = 2, Beginner = 1.
     */
    public int getProficiencyScore() {
        if (proficiencyLevel == null) return 0;
        switch (proficiencyLevel.toLowerCase()) {
            case "advanced": return 3;
            case "intermediate": return 2;
            case "beginner": return 1;
            default: return 0;
        }
    }
}
