export interface DashboardSummary {
    as_holder: {
        total: number
        new: number
        in_progress: number
        complete: number
    }
    as_staff: {
        total: number
        new: number
        in_progress: number
        complete: number
    }
}

export interface UserStats {
    as_holder: {
        stat: {
            date: string
            total: number
            new: number
            in_progress: number
            complete: number
        }[]
        avg: {
            avg_seconds: number
            avg_hms: string
        }
    }
    as_staff: {
        stat: {
            date: string
            total: number
            new: number
            in_progress: number
            complete: number
        }[] 
        avg: {
            avg_seconds: number
            avg_hms: string
        }
    }
    time_series: {
        date: string
        tickets: number
        resolved: number
        inProgress: number
    }[]
    activity: {
        day: string
        hour: string
        value: number
    }[]
}

export interface AdminStats {
    stat: {
        date: string
        total: number
        new: number
        in_progress: number
        complete: number
    }[]
    avg: {
        avg_seconds: number
        avg_hms: string
    }
    time_series: {
        date: string
        tickets: number
        resolved: number
        inProgress: number
    }[]
    staff_performance: {
        name: string
        "Total Tickets": number
        "Resolved": number
        "In Progress": number
        "Avg. Resolution Time": number
    }[]
    activity: {
        day: string
        hour: string
        value: number
    }[]
    active_staff: number
}