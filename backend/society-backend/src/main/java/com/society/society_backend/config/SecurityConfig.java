package com.society.society_backend.config;

import com.society.society_backend.security.JwtAuthFilter;
import com.society.society_backend.security.JwtService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/api/hello").permitAll()

                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/flats").hasRole("ADMIN")

                        .requestMatchers("/api/residents/search").hasRole("SECURITY")

                        .requestMatchers(HttpMethod.POST, "/api/visitors").hasRole("SECURITY")
                        .requestMatchers(HttpMethod.GET, "/api/visitors/my").hasRole("RESIDENT")
                        .requestMatchers("/api/visitors/*/approve", "/api/visitors/*/reject").hasRole("RESIDENT")
                        .requestMatchers("/api/visitors/*/entry", "/api/visitors/*/exit").hasRole("SECURITY")
                        .requestMatchers(HttpMethod.GET, "/api/visitors/*").hasAnyRole("SECURITY", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/visitors").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/complaints").hasRole("RESIDENT")
                        .requestMatchers(HttpMethod.GET, "/api/complaints/my").hasRole("RESIDENT")
                        .requestMatchers(HttpMethod.PUT, "/api/complaints/*/status").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/complaints/*").hasAnyRole("RESIDENT", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/complaints").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/notices").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/notices/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/notices").authenticated()

                        .requestMatchers(HttpMethod.POST, "/api/maintenance", "/api/maintenance/generate").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/maintenance/*/pay").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/maintenance/my").hasRole("RESIDENT")
                        .requestMatchers(HttpMethod.GET, "/api/maintenance").hasRole("ADMIN")

                        .requestMatchers("/api/family", "/api/family/**").hasRole("RESIDENT")

                        .anyRequest().authenticated())
                .addFilterBefore(new JwtAuthFilter(jwtService), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}