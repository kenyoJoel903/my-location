package com.kenyo.location.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ApplicacionController {
	
	@GetMapping
	public String inicio() {
		return "home";
	}

}
