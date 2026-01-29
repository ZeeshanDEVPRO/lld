#pragma once
#include "Enums.h"

class ParkingSlot {
    int id;
    SlotType type;
    bool occupied;
    int floorNo;

public:
    ParkingSlot(int id, SlotType type, int floorNo)
        : id(id), type(type), occupied(false), floorNo(floorNo) {}

    int getId() const {
        return id;
    }

    SlotType getType() const {
        return type;
    }

    int getFloorNo() const {
        return floorNo;
    }

    bool isOccupied() const {
        return occupied;
    }

    void occupy() {
        occupied = true;
    }

    void release() {
        occupied = false;
    }
};
