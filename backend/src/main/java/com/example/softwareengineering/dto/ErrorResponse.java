package com.example.softwareengineering.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private String message;
    private int status;
    private String code;
    private String timestamp;

    public ErrorResponse(String message) {
        this.message = message;
    }

    public ErrorResponse(String message, int status) {
        this.message = message;
        this.status = status;
    }
}
