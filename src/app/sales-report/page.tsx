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
    const months = [
        { value: '0', label: 'All Months' },
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
    const years = [
        { value: '0', label: 'All Years' },
        ...Array.from({ length: 20 }, (_, i) => ({
            value: (currentYear - i).toString(),
            label: (currentYear - i).toString(),
        }))
    ]

    const [month, setMonth] = useState<string>(months[0].value)
    const [year, setYear] = useState<string>(years[0].value)

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-bold">Sales</h1>

            <div className="flex flex-col md:flex-row items-center gap-2">
                <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="w-[120px]">
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
                            <SelectItem key={y.value} value={y.value}>
                                {y.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {(month !== '0' || year !== '0') && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setMonth(months[0].value)
                            setYear(years[0].value)
                        }}
                        className="h-9 px-2 lg:px-3"
                    >
                        Reset
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <div className="flex flex-col items-start gap-4">
                <a
                    href={`/api/sales?${new URLSearchParams({
                        ...(month !== '0' ? { month } : {}),
                        ...(year !== '0' ? { year } : {}),
                    }).toString()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={month !== '0' && year === '0' ? 'pointer-events-none opacity-50' : ''}
                >
                    <Button disabled={month !== '0' && year === '0'}>
                        Generate Sales Report
                    </Button>
                </a>
                {month !== '0' && year === '0' && (
                    <p className="text-sm text-red-500 font-medium">
                        Please select a Year to generate a monthly report.
                    </p>
                )}
            </div>
        </div>
    )
}
