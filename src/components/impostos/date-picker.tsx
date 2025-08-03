"use client"

import * as React from "react"
import { format, subMonths, startOfMonth, endOfMonth, getYear } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface DatePickerWithPresetsProps {
  date: Date;
  setDate: (date: Date) => void;
  className?: string;
}

export function DatePickerWithPresets({ date, setDate, className }: DatePickerWithPresetsProps) {
  const handlePresetSelect = (value: string) => {
    const now = new Date();
    if (value === "current") {
      setDate(startOfMonth(now));
    } else if (value === "previous") {
      setDate(startOfMonth(subMonths(now, 1)));
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "MMMM, yyyy", { locale: ptBR }) : <span>Selecione um mês</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="flex w-auto flex-col space-y-2 p-2"
        >
          <Select onValueChange={handlePresetSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="current">Este Mês</SelectItem>
              <SelectItem value="previous">Mês Anterior</SelectItem>
            </SelectContent>
          </Select>
          <div className="rounded-md border">
            <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                // This is a bit of a trick to show month/year picker by default
                captionLayout="dropdown-buttons"
                fromYear={getYear(new Date()) - 5}
                toYear={getYear(new Date())}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
