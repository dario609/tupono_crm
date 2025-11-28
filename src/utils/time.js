export const calculateTotalHours = (startTime, finishTime) => {
    if (!startTime || !finishTime || startTime === "00:00" || finishTime === "00:00") {
        return "";
    }

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [finishHours, finishMinutes] = finishTime.split(':').map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const finishTotalMinutes = finishHours * 60 + finishMinutes;
    const totalMinutes = finishTotalMinutes - startTotalMinutes;

    let totalHours = totalMinutes / 60;

    // Format to 1 decimal OR whole number
    totalHours = Number.isInteger(totalHours)
        ? totalHours.toString()          // no decimals (e.g. "3")
        : totalHours.toFixed(1);         // 1 decimal (e.g. "3.5")

    return totalHours;
};


  // Validate that time_finish is later than time_start
  export const validateTimeRange = (startTime, finishTime) => {
    if (!startTime || !finishTime || startTime === "00:00" || finishTime === "00:00") {
        return { isValid: true, error: "" };
    }

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [finishHours, finishMinutes] = finishTime.split(':').map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    let finishTotalMinutes = finishHours * 60 + finishMinutes;

    // Check if finish is on the same day and later than start
    if (finishTotalMinutes <= startTotalMinutes) {
        // Check if it's a next-day scenario (e.g., 23:00 to 01:00)
        const nextDayFinish = finishTotalMinutes + (24 * 60);
        if (nextDayFinish <= startTotalMinutes) {
            return { isValid: false, error: "Time Finish must be later than Time Start" };
        }
    }

    return { isValid: true, error: "" };
};