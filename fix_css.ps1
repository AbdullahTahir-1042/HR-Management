$content = Get-Content -Raw -Path frontend\src\index.css
$index = $content.IndexOf(".no-scrollbar {")

if ($index -ge 0) {
    # Keep the file up to .no-scrollbar
    $newContent = $content.Substring(0, $index) + ".no-scrollbar {`n    -ms-overflow-style: none;`n    scrollbar-width: none;`n  }`n}`n`n"
    
    # Append the custom CSS
    $newContent += @"
/* ── React DatePicker Custom Overrides ── */

/* Fix close/clear cross button styling & alignment */
.react-datepicker__close-icon::after {
  content: `"`" !important;
  background-color: #4f46e5 !important;
  background-image: url(`"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'%3E%3C/line%3E%3Cline x1='6' y1='6' x2='18' y2='18'%3E%3C/line%3E%3C/svg%3E`") !important;
  background-size: 10px 10px !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
  height: 20px !important;
  width: 20px !important;
  border-radius: 50% !important;
  display: block !important;
}

/* Dark Mode Calendar Overrides */
.dark .react-datepicker {
  background-color: var(--card-bg) !important;
  border-color: var(--card-border) !important;
  color: var(--text-primary) !important;
  font-family: inherit !important;
}

.dark .react-datepicker__header {
  background-color: #0f172a !important;
  border-bottom-color: var(--card-border) !important;
}

.dark .react-datepicker__current-month,
.dark .react-datepicker-time__header,
.dark .react-datepicker-year-header {
  color: var(--text-primary) !important;
}

.dark .react-datepicker__day-name {
  color: var(--text-muted) !important;
}

.dark .react-datepicker__day,
.dark .react-datepicker__time-name {
  color: var(--text-primary) !important;
}

.dark .react-datepicker__day:hover,
.dark .react-datepicker__month-text:hover,
.dark .react-datepicker__quarter-text:hover,
.dark .react-datepicker__year-text:hover {
  background-color: #334155 !important;
}

.dark .react-datepicker__day--selected,
.dark .react-datepicker__day--in-selecting-range,
.dark .react-datepicker__day--in-range,
.dark .react-datepicker__month-text--selected,
.dark .react-datepicker__month-text--in-selecting-range,
.dark .react-datepicker__month-text--in-range,
.dark .react-datepicker__quarter-text--selected,
.dark .react-datepicker__quarter-text--in-selecting-range,
.dark .react-datepicker__quarter-text--in-range,
.dark .react-datepicker__year-text--selected,
.dark .react-datepicker__year-text--in-selecting-range,
.dark .react-datepicker__year-text--in-range {
  background-color: var(--accent) !important;
  color: white !important;
}

.dark .react-datepicker__day--keyboard-selected,
.dark .react-datepicker__month-text--keyboard-selected,
.dark .react-datepicker__quarter-text--keyboard-selected,
.dark .react-datepicker__year-text--keyboard-selected {
  background-color: var(--accent-light-bg) !important;
  color: var(--accent-light-text) !important;
}

.dark .react-datepicker__day--disabled,
.dark .react-datepicker__month-text--disabled,
.dark .react-datepicker__quarter-text--disabled,
.dark .react-datepicker__year-text--disabled {
  color: #475569 !important;
}

.dark .react-datepicker__day--outside-month {
  color: #475569 !important;
}

.dark .react-datepicker__navigation-icon::before {
  border-color: var(--text-muted) !important;
}

.dark .react-datepicker__navigation:hover *::before {
  border-color: var(--text-primary) !important;
}
"@

    Set-Content -Path frontend\src\index.css -Value $newContent
}
