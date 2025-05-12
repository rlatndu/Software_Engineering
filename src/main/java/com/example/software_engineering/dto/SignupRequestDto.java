package com.example.software_engineering.dto;

public class SignupRequestDto {
    private String email;
    private String name;
    private String password;

    // Getter, Setter (Lombok 사용 시 @Getter, @Setter 붙이고 생략 가능)
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
