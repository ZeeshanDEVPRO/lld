#pragma once
#include "Enums.h"
#include <string>

class Vehicle {
    int id;
    std::string plate;
    VehicleType type;

public:
    Vehicle(int id, const std::string& plate, VehicleType type): id(id), plate(plate), type(type) {

    }

    int getId() const {
        return id;
    }

    const std::string& getPlate() const {
        return plate;
    }

    VehicleType getType() const {
        return type;
    }
};
