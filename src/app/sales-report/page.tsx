'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { RotateCcw } from 'lucide-react'

export default function InvoicesPage() {
    const [month, setMonth] = useState<string>('')
    const [year, setYear] = useState<string>('')

    const months = [
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ]

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 20 }, (_, i) => (currentYear - i).toString())

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-bold">Sales</h1>

            <div className="flex flex-col md:flex-row items-center gap-2">
                <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                                {m.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((y) => (
                            <SelectItem key={y} value={y}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {(month || year) && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setMonth('')
                            setYear('')
                        }}
                        className="h-9 px-2 lg:px-3"
                    >
                        Reset
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <a
                href={`/api/sales?month=${month}&year=${year}`}
                target="_blank"
                rel="noopener noreferrer"
            >
                <Button>Generate Sales Report</Button>
            </a>
        </div>
    )
}
