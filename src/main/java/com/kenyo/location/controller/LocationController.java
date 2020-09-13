package com.kenyo.location.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import com.kenyo.location.model.Location;

@Controller
public class LocationController {
	
	@MessageMapping("/location")
	@SendTo("/topic/connect")
	public Location location(Location location) throws Exception {
		Thread.sleep(1000); // simulated delay
		return location;
	}

}
