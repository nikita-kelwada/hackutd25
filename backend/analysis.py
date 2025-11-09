# backend/analysis.py
from datetime import datetime, timedelta
from typing import List, Dict, Any

def detect_drain_events(
    cauldron_id: str,
    historical_data: List[Dict[str, Any]], 
    cauldrons: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    
    cauldron_info = next((c for c in cauldrons if c.get('id') == cauldron_id), None)
    if not cauldron_info:
        print(f"Warning: No info found for cauldron {cauldron_id}")
        return []

    fill_rate = cauldron_info.get('fillRatePerMinute', 0)
    
    levels_data = []
    for entry in historical_data:
        timestamp_str = entry.get("timestamp")
        cauldron_levels = entry.get("cauldron_levels")
        if not timestamp_str or not cauldron_levels:
            continue
        
        level = cauldron_levels.get(cauldron_id)
        if level is None:
            continue
            
        try:
            timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            levels_data.append({"timestamp": timestamp, "level": float(level)})
        except ValueError:
            continue
    
    if len(levels_data) < 2:
        return []
        
    levels_data.sort(key=lambda x: x["timestamp"])

    detected_events = []
    is_draining = False
    current_drain = {}
    
    drain_threshold_per_min = fill_rate * 0.8

    for i in range(1, len(levels_data)):
        prev = levels_data[i-1]
        curr = levels_data[i]

        time_delta_seconds = (curr["timestamp"] - prev["timestamp"]).total_seconds()
        
        if time_delta_seconds <= 0 or time_delta_seconds > 120:
            if is_draining:
                is_draining = False
                current_drain = {}
            continue
            
        time_delta_minutes = time_delta_seconds / 60.0
        level_change = curr["level"] - prev["level"]
        level_change_per_min = level_change / time_delta_minutes

        if level_change_per_min < drain_threshold_per_min and not is_draining:
            # --- DRAIN START ---
            is_draining = True
            current_drain = {
                "cauldronId": cauldron_id,
                "startTime": prev["timestamp"].isoformat(),
                "startLevel": prev["level"],
                # --- ADDED for Recharts graph ---
                "start": int(prev["timestamp"].timestamp() * 1000) 
            }
        
        elif level_change_per_min >= drain_threshold_per_min and is_draining:
            # --- DRAIN END ---
            is_draining = False
            current_drain["endTime"] = prev["timestamp"].isoformat() 
            current_drain["endLevel"] = prev["level"]
            # --- ADDED for Recharts graph ---
            current_drain["end"] = int(prev["timestamp"].timestamp() * 1000)
            
            duration_seconds = (prev["timestamp"] - datetime.fromisoformat(current_drain["startTime"])).total_seconds()
            duration_minutes = duration_seconds / 60.0
            
            if duration_minutes > 0:
                level_loss = current_drain["startLevel"] - current_drain["endLevel"]
                potion_filled_during_drain = fill_rate * duration_minutes
                
                total_volume_drained = level_loss + potion_filled_during_drain
                
                current_drain["calculatedVolume"] = total_volume_drained
                detected_events.append(current_drain)
            
            current_drain = {}
    
    print(f"Detected {len(detected_events)} events for {cauldron_id}")
    return detected_events