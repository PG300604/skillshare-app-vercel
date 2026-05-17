package com.example.skillshare.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.spec.SecretKeySpec;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable()) // Typical for stateless REST APIs
            .authorizeHttpRequests(authz -> authz
                // Allow H2 console for local dev (requires disabling frame options too)
                .requestMatchers("/h2-console/**").permitAll()
                // All other endpoints must be authenticated via Supabase JWT
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.decoder(jwtDecoder()))
            )
            // Allow frames for H2 console
            .headers(headers -> headers.frameOptions(frame -> frame.disable()));
            
        return http.build();
    }

    @Value("${spring.security.oauth2.resourceserver.jwt.secret:}")
    private String jwtSecret;

    @Bean
    public org.springframework.security.oauth2.jwt.JwtDecoder jwtDecoder() {
        String jwkSetUri = "https://fsvidhqsmovodluunupe.supabase.co/auth/v1/.well-known/jwks.json";
        
        final org.springframework.security.oauth2.jwt.NimbusJwtDecoder es256Decoder = org.springframework.security.oauth2.jwt.NimbusJwtDecoder
                .withJwkSetUri(jwkSetUri)
                .jwsAlgorithm(org.springframework.security.oauth2.jose.jws.SignatureAlgorithm.ES256)
                .build();
                
        final org.springframework.security.oauth2.jwt.NimbusJwtDecoder rs256Decoder = org.springframework.security.oauth2.jwt.NimbusJwtDecoder
                .withJwkSetUri(jwkSetUri)
                .jwsAlgorithm(org.springframework.security.oauth2.jose.jws.SignatureAlgorithm.RS256)
                .build();
                
        return new org.springframework.security.oauth2.jwt.JwtDecoder() {
            @Override
            public org.springframework.security.oauth2.jwt.Jwt decode(String token) throws org.springframework.security.oauth2.jwt.JwtException {
                try {
                    return es256Decoder.decode(token);
                } catch (Exception e1) {
                    try {
                        return rs256Decoder.decode(token);
                    } catch (Exception e2) {
                        if (jwtSecret != null && !jwtSecret.isEmpty()) {
                            try {
                                org.springframework.security.oauth2.jwt.NimbusJwtDecoder hs256Decoder = org.springframework.security.oauth2.jwt.NimbusJwtDecoder
                                        .withSecretKey(new javax.crypto.spec.SecretKeySpec(jwtSecret.getBytes(), "HmacSHA256"))
                                        .macAlgorithm(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256)
                                        .build();
                                return hs256Decoder.decode(token);
                            } catch (Exception e3) {
                                System.err.println("JWT Verification Failed. ES256: " + e1.getMessage() + ", RS256: " + e2.getMessage() + ", HS256: " + e3.getMessage());
                                throw new org.springframework.security.oauth2.jwt.JwtValidationException("Invalid JWT signature", Arrays.asList(new org.springframework.security.oauth2.core.OAuth2Error("invalid_token", "No matching algorithm found", null)));
                            }
                        } else {
                            System.err.println("JWT Verification Failed. ES256: " + e1.getMessage() + ", RS256: " + e2.getMessage() + " (HS256 skipped, secret missing)");
                            throw e1;
                        }
                    }
                }
            }
        };
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173", 
            "https://skillshare-app-vercel.vercel.app",
            "https://skillshare-app-vercel-xv9i.vercel.app"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
