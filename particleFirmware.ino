#include <string>

int relays[] = {D2, D3, D4, D7};

// Expose function
bool successOn = Particle.function("turnOn", turnOn);
bool successOff = Particle.function("turnOff", turnOff);

// Necessary because string manipulation in Arduino sucks
int selectRelay(String relayString) {
	if (relayString == "1") {
		return relays[0];
	} else if (relayString == "2") {
		return relays[1];
	} else if (relayString == "3") {
		return relays[2];
	} else if (relayString == "4") {
		return relays[3];
	} else {
		return -1;
	}
}

// Turn on inputted relay
int turnOn(String relay) {
	int relayNum = selectRelay(relay);
	digitalWrite(relayNum, HIGH);
	return relayNum;
}

// Turn off inputted relay
int turnOff(String relay) {
	int relayNum = selectRelay(relay);
	digitalWrite(relayNum, LOW);
	return relayNum;
}

void setup() {
	// Set all relay pins as outputs
	for (unsigned int i = 0; i < sizeof(relays); ++i) {
		pinMode(relays[i], OUTPUT);
	}
}

void loop() {
	// Do nothing, only exposing functions
}