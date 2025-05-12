import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import { ko } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface Props {
  onChange: (range: { startDate: Date; endDate: Date }) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

const DateRangePickerWrapper: React.FC<Props> = ({
  onChange,
  initialStartDate,
  initialEndDate,
}) => {
  const [range, setRange] = useState([
    {
      startDate: initialStartDate || new Date(),
      endDate: initialEndDate || new Date(),
      key: 'selection',
    },
  ]);

  const handleChange = (ranges: any) => {
    const { startDate, endDate } = ranges.selection;
    setRange([ranges.selection]);
    onChange({ startDate, endDate });
  };

  return (
    <div>
      <DateRange
        editableDateInputs={true}
        onChange={handleChange}
        moveRangeOnFirstSelection={false}
        ranges={range}
        locale={ko}
        months={1}
        direction="horizontal"
      />
    </div>
  );
};

export default DateRangePickerWrapper;
