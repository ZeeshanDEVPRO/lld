#pragma once

class Ticket {
    int id;
    int vehicleId;
    int slotId;
    long entryTime;
    bool active;

public:
    Ticket(int id, int vehicleId, int slotId, long entryTime)
        : id(id),
          vehicleId(vehicleId),
          slotId(slotId),
          entryTime(entryTime),
          active(true) {}

    int getId() const {
        return id;
    }

    int getVehicleId() const {
        return vehicleId;
    }

    int getSlotId() const {
        return slotId;
    }

    long getEntryTime() const {
        return entryTime;
    }

    bool isActive() const {
        return active;
    }

    void close() {
        active = false;
    }
};
