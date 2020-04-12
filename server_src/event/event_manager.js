class Event {
    constructor(name, start, end) {
        this.name = name;
        this.startTime = start;
        this.endTime = end;
    }

    isActive() {
        return false;
    }
};