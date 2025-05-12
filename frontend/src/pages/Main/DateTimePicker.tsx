import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import { addDays } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface Props {
  value: { startDate: Date; endDate: Date };
  onChange: (range: { startDate: Date; endDate: Date }) => void;
}

const DateRangePicker: React.FC<Props> = ({ value, onChange }) => {
  const [selectionRange, setSelectionRange] = useState([
    {
      startDate: value.startDate,
      endDate: value.endDate,
      key: 'selection',
    },
  ]);

  const handleSelect = (ranges: any) => {
    const { startDate, endDate } = ranges.selection;
    setSelectionRange([ranges.selection]);
    onChange({ startDate, endDate });
  };

  return (
    <DateRange
      ranges={selectionRange}
      onChange={handleSelect}
      moveRangeOnFirstSelection={false}
      editableDateInputs={true}
      months={1}
      direction="horizontal"
      showDateDisplay={false}
    />
  );
};

export default DateRangePicker;
