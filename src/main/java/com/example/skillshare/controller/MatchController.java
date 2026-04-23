package com.example.skillshare.controller;

import com.example.skillshare.model.User;
import com.example.skillshare.model.UserSkill;
import com.example.skillshare.service.MatchService;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @GetMapping("/discover")
    public List<User> discoverCollaborators(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        
        // Mocking the current user as requested
        User currentUser = new User();
        currentUser.setId(UUID.randomUUID());
        currentUser.setLatitude(lat != null ? lat : 0.0);
        currentUser.setLongitude(lng != null ? lng : 0.0);
        
        List<UserSkill> skills = new ArrayList<>();
        UserSkill javaSkill = new UserSkill();
        javaSkill.setSkillName("Java");
        javaSkill.setProficiencyLevel("Advanced"); // represents score 3 or top tier
        
        UserSkill springSkill = new UserSkill();
        springSkill.setSkillName("Spring Boot");
        springSkill.setProficiencyLevel("Advanced");
        
        skills.add(javaSkill);
        skills.add(springSkill);
        currentUser.setSkills(skills);

        // Call our dynamic radius search, starting at 10km search
        return matchService.findCollaborators(currentUser, 10.0);
    }
}
