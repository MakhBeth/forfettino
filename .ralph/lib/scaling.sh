#!/bin/bash
# scaling.sh - Dynamic parallel scaling based on resources
# Source this file: source lib/scaling.sh

PARALLEL_MAX="${PARALLEL_MAX:-2}"

# Get available RAM in GB
get_available_ram_gb() {
    free -g 2>/dev/null | awk '/^Mem:/ {print $7}' || echo "4"
}

# Get CPU core count
get_cpu_cores() {
    nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "2"
}

# Get 1-min load average
get_cpu_load() {
    uptime | awk -F'load average:' '{print $2}' | cut -d',' -f1 | tr -d ' ' || echo "1"
}

# Calculate optimal parallel processes
calculate_optimal_parallel() {
    local available_ram=$(get_available_ram_gb)
    local cpu_cores=$(get_cpu_cores)
    local cpu_load=$(get_cpu_load)

    # 2 processes per GB free RAM
    local ram_based_max=$((available_ram * 2))

    # CPU: cores - current load
    local load_int=${cpu_load%.*}
    local cpu_based_max=$((cpu_cores - load_int))
    [ $cpu_based_max -lt 1 ] && cpu_based_max=1

    # Take minimum
    local optimal=$ram_based_max
    [ $cpu_based_max -lt $optimal ] && optimal=$cpu_based_max

    # Clamp to 1-6
    [ $optimal -lt 1 ] && optimal=1
    [ $optimal -gt 6 ] && optimal=6

    echo $optimal
}

# Maybe adjust PARALLEL_MAX based on current resources
maybe_scale_parallel() {
    local current_running=${1:-0}
    local new_max=$(calculate_optimal_parallel)

    if [ $new_max -ne $PARALLEL_MAX ]; then
        echo "[scaling] $PARALLEL_MAX → $new_max (RAM: $(get_available_ram_gb)GB, load: $(get_cpu_load))"
        PARALLEL_MAX=$new_max
    fi
}
