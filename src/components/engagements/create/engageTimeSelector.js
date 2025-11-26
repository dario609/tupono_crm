import React from "react";

export default function EngageTimeSelector({ value, error, onChange, label }) {
    // Generate hours (00-23) and minutes (00-59)
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
    
    // Parse current value (format: "HH:mm")
    const parseTime = (timeValue) => {
        if (timeValue && typeof timeValue === 'string') {
            const parts = timeValue.split(':');
            return {
                hour: parts[0] || '00',
                minute: parts[1] || '00'
            };
        }
        return { hour: '00', minute: '00' };
    };
    
    const [selectedHour, setSelectedHour] = React.useState(() => parseTime(value).hour);
    const [selectedMinute, setSelectedMinute] = React.useState(() => parseTime(value).minute);
    
    // Update local state when value prop changes
    React.useEffect(() => {
        const parsed = parseTime(value);
        setSelectedHour(parsed.hour);
        setSelectedMinute(parsed.minute);
    }, [value]);
    
    // Update parent when hour or minute changes
    React.useEffect(() => {
        const timeValue = `${selectedHour}:${selectedMinute}`;
        if (value !== timeValue) {
            onChange(timeValue);
        }
    }, [selectedHour, selectedMinute]); // eslint-disable-line react-hooks/exhaustive-deps
    
    return (
        <div className="col-md-4 mb-3">
            <label className="form-label">{label}</label>
            <div className="d-flex align-items-center gap-2">
                <select
                    className={`form-control ${error ? "is-invalid" : ""}`}
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(e.target.value)}
                    style={{ flex: 1 }}
                >
                    {hours.map((h) => (
                        <option key={h} value={h}>
                            {h}
                        </option>
                    ))}
                </select>
                <span style={{ fontSize: "18px", fontWeight: "bold" }}>:</span>
                <select
                    className={`form-control ${error ? "is-invalid" : ""}`}
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(e.target.value)}
                    style={{ flex: 1 }}
                >
                    {minutes.map((m) => (
                        <option key={m} value={m}>
                            {m}
                        </option>
                    ))}
                </select>
            </div>
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    );
}

