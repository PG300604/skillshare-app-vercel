package com.example.skillshare.controller;

import com.example.skillshare.model.User;
import com.example.skillshare.model.UserSkill;
import com.example.skillshare.repository.UserRepository;
import com.example.skillshare.service.MatchService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchService matchService;
    private final UserRepository userRepository;

    public MatchController(MatchService matchService, UserRepository userRepository) {
        this.matchService = matchService;
        this.userRepository = userRepository;
    }

    @GetMapping("/discover")
    public List<User> discoverCollaborators(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        
        UUID userId = UUID.fromString(jwt.getSubject());
        
        // Fetch user from DB, or create a temporary one for the session if not fully onboarded
        User currentUser = userRepository.findById(userId).orElseGet(() -> {
            User newUser = new User();
            newUser.setId(userId);
            newUser.setLatitude(lat != null ? lat : 0.0);
            newUser.setLongitude(lng != null ? lng : 0.0);
            
            // Default skills for new user matching if they haven't set them yet
            List<UserSkill> defaultSkills = new ArrayList<>();
            UserSkill defaultSkill = new UserSkill();
            defaultSkill.setSkillName("General");
            defaultSkill.setProficiencyLevel("Beginner");
            defaultSkills.add(defaultSkill);
            newUser.setSkills(defaultSkills);
            
            return newUser;
        });

        // Update lat/lng dynamically if provided by mobile client
        if (lat != null) currentUser.setLatitude(lat);
        if (lng != null) currentUser.setLongitude(lng);

        // Call our dynamic radius search, starting at 10km search
        return matchService.findCollaborators(currentUser, 10.0);
    }
}
