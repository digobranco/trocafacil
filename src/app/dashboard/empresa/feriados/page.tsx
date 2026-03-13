import { getHolidays } from './actions'
import { HolidayManager } from './holiday-manager'

export default async function FeriadosPage() {
    const holidays = await getHolidays()

    return (
        <div className="p-6 overflow-y-auto h-full">
            <HolidayManager initialHolidays={holidays} />
        </div>
    )
}
