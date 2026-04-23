package com.example.skillshare.service;

import com.example.skillshare.model.User;
import com.example.skillshare.model.UserSkill;
import com.example.skillshare.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MatchService {

    private final UserRepository userRepository;

    public MatchService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> findCollaborators(User currentUser, double initialRadius) {
        if (currentUser.getSkills() == null || currentUser.getSkills().isEmpty()) {
            return List.of();
        }

        List<String> userSkillNames = currentUser.getSkills().stream()
                .map(UserSkill::getSkillName)
                .collect(Collectors.toList());

        // Fetch all candidate users sharing at least one skill
        List<User> candidates = userRepository.findUsersWithSharedSkills(userSkillNames, currentUser.getId());

        return findCollaboratorsRecursive(currentUser, candidates, userSkillNames, initialRadius, 100.0);
    }

    private List<User> findCollaboratorsRecursive(User currentUser, List<User> candidates, List<String> userSkillNames, double currentRadius, double maxRadius) {
        
        List<User> matches = candidates.stream()
                .filter(candidate -> calculateDistance(
                        currentUser.getLatitude(), currentUser.getLongitude(),
                        candidate.getLatitude(), candidate.getLongitude()) <= currentRadius)
                .collect(Collectors.toList());

        if (matches.size() < 3 && currentRadius < maxRadius) {
            double nextRadius = Math.min(currentRadius + 10.0, maxRadius);
            if (nextRadius > currentRadius) {
                return findCollaboratorsRecursive(currentUser, candidates, userSkillNames, nextRadius, maxRadius);
            }
        }

        // --- Fallback: If 0 results within 100km, return Featured Global ---
        if (matches.isEmpty()) {
            List<User> globalMatches = new java.util.ArrayList<>(candidates);
            if (globalMatches.isEmpty()) {
                 // No one globally shares a skill, fetch random 5
                 return userRepository.findAll().stream()
                         .filter(u -> !u.getId().equals(currentUser.getId()))
                         .limit(5)
                         .collect(Collectors.toList());
            }
            // Sort global candidates by proficiency, ignoring distance filter
            globalMatches.sort((u1, u2) -> {
                int score1 = getMaxSharedProficiencyScore(u1, userSkillNames);
                int score2 = getMaxSharedProficiencyScore(u2, userSkillNames);
                return Integer.compare(score2, score1);
            });
            return globalMatches.stream().limit(5).collect(Collectors.toList());
        }

        // Sort local results by highest proficiency level in the shared skill
        matches.sort((u1, u2) -> {
            int score1 = getMaxSharedProficiencyScore(u1, userSkillNames);
            int score2 = getMaxSharedProficiencyScore(u2, userSkillNames);
            return Integer.compare(score2, score1);
        });

        return matches;
    }

    private int getMaxSharedProficiencyScore(User candidate, List<String> targetSkillNames) {
        if (candidate.getSkills() == null) return 0;
        
        return candidate.getSkills().stream()
                .filter(skill -> targetSkillNames.contains(skill.getSkillName()))
                .mapToInt(UserSkill::getProficiencyScore)
                .max()
                .orElse(0);
    }

    /**
     * Calculates distance using the Haversine formula
     * @return Distance in kilometers
     */
    private double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return Double.MAX_VALUE;
        }

        final int R = 6371; // Radius of the earth in km

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
}
