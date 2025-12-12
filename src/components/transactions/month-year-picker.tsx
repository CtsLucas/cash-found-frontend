
'use client'

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { subMonths, addMonths, format } from "date-fns"

interface MonthYearPickerProps {
    date: Date;
    setDate: (date: Date) => void;
}

export function MonthYearPicker({ date, setDate }: MonthYearPickerProps) {

    const handlePrevMonth = () => {
        setDate(subMonths(date, 1));
    }

    const handleNextMonth = () => {
        setDate(addMonths(date, 1));
    }

    return (
        <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold w-36 text-center">
                {format(date, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}

