# Extended DateTimePicker (jQuery Plugin)

A modern, responsive, and internationalizable date and time picker plugin built for **jQuery** and optimized for **Bootstrap 5**. Designed to be highly customizable, featuring support for date ranges, multiple selection, birthday mode, advanced date blocking rules, layout control, and 12-hour or 24-hour time format support.

## 🔗 Live Demo

You can test the plugin live here: [View Interactive Demo](https://pinedamb.github.io/extended_datetimepicker/)

---

## 🚀 Features

- **Date Selection Modes**: `single`, `range`, `multiple`, and `birthday`.
- **Flexible Layouts (`layout`)**: Supports both **vertical** and **horizontal** orientations to fit seamlessly into different UI designs.
- **Dual Month View (`doubleMonth`)**: Displays two consecutive months to streamline range selection.
- **Integrated Clock & Range Times**: Intuitive hour and minute selection with support for **12-hour (with AM/PM)** or **24-hour military** format (`format24h`), including individual time selection for start and end dates when using the `range` mode.
- **Responsive Adaptability**: Automatic fluid scaling and layout wrapping on mobile devices and narrow containers.
- **Fine-Grained Date Control**: Support for date limits (`minDate`, `maxDate`), weekend blocking (`disableWeekends`), specific date disabling (`disabledDates`), and default time initialization (`defaultTime`).
- **Internationalization (i18n)**: Built-in support for multiple languages, with the ability to pass custom translation objects.
- **Format Support**: Reusable internal formatter (`YYYY-MM-DD`, `DD/MM/YYYY`, etc.).
- **Clean Behavior**: Automatic close when clicking outside the control and robust support for API calls (`open`, `close`, `destroy`).

---

## 📦 Installation

Ensure you include the required dependencies in your project first (jQuery and Bootstrap 5 CSS):

```html
<!-- Bootstrap 5 CSS -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
/>

<!-- jQuery -->
<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
```

Import the compiled plugin and its styles into your JavaScript entry point/bundle:

```html
<link
  rel="stylesheet"
  href="./path/to/jquery.extended.datetimepicker.min.css"
/>
<script src="./path/to/jquery.extended.datetimepicker.min.js"></script>
```

If you prefer the CDN version, you can use the following links:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/PinedaMB/extended_datetimepicker@latest/dist/jquery.extended.datetimepicker.min.css"
/>
<script src="https://cdn.jsdelivr.net/gh/PinedaMB/extended_datetimepicker@latest/dist/jquery.extended.datetimepicker.min.js"></script>
```

---

## 💡 Basic Usage

### 1. Target Element (Input)

```html
<input
  type="text"
  id="my-datepicker"
  class="form-control"
  placeholder="Select a date"
/>
```

### 2. Initialization

```javascript
$("#my-datepicker").extendedDateTimePicker({
  mode: "single",
  layout: "vertical",
  showClock: true,
  showCalendar: true,
  themeColor: "primary",
  format24h: true,
  defaultTime: "14:30",
  lang: "es",
});
```

### 3. Inline Container

An `input` opens a dropdown on focus or click. A `div` or generic container displays the picker inline immediately:

```html
<div id="inline-picker"></div>
```

```javascript
$("#inline-picker").extendedDateTimePicker({
  showClock: false,
  selectedDates: ["2026-10-15"],
});
```

Initializing an existing instance replaces it. `destroy` removes the plugin controls and listeners and restores the original input attributes; it does not restore content removed from an inline container.

---

## 📅 Setting a Default Date

Use `selectedDates` to preselect a date and populate the input when the picker is initialized. Always supply dates in `YYYY-MM-DD` format, even when `dateFormat` uses a different display format.

```javascript
$("#my-datepicker").extendedDateTimePicker({
  mode: "single",
  selectedDates: ["2026-10-15"],
  showClock: false,
  dateFormat: "DD/MM/YYYY",
});
// Initial input value: 15/10/2026
```

To set both a default date and time, enable the clock and use `defaultTime`:

```javascript
$("#my-datepicker").extendedDateTimePicker({
  selectedDates: ["2026-10-15"],
  showClock: true,
  format24h: true,
  defaultTime: "14:30",
});
// Initial input value: 2026-10-15 14:30
```

For a range, supply the start and end dates. For multiple selection, supply all initial dates:

```javascript
$("#range-picker").extendedDateTimePicker({
  mode: "range",
  selectedDates: ["2026-10-15", "2026-10-20"],
  showClock: false,
});

$("#multiple-picker").extendedDateTimePicker({
  mode: "multiple",
  selectedDates: ["2026-10-15", "2026-10-20", "2026-10-23"],
  showClock: false,
});
```

`selectedDates` also works in `birthday` mode. Single and birthday modes use one initial date; range mode uses up to two. Initial dates must be valid and respect `minDate`, `maxDate`, `disableWeekends`, and `disabledDates`; invalid or blocked dates are ignored. Birthday dates must additionally have a year between 1900 and the current year. Initialization does not trigger selection callbacks or `input`/`change` events.

---

## ⚙️ Configurable Options Table

| Option            | Type            | Default        | Description / Allowed Values                                                                  |
| ----------------- | --------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `mode`            | `string`        | `'single'`     | Selection mode: `'single'`, `'range'`, `'multiple'`, or `'birthday'`.                         |
| `layout`          | `string`        | `'vertical'`   | Panel orientation: `'vertical'` or `'horizontal'`.                                            |
| `showCalendar`    | `boolean`       | `true`         | Shows or hides the calendar section.                                                          |
| `showClock`       | `boolean`       | `true`         | Shows or hides the clock section.                                                             |
| `themeColor`      | `string`        | `'success'`    | Bootstrap color theme (e.g., `'primary'`, `'success'`, `'danger'`).                           |
| `format24h`       | `boolean`       | `true`         | If `true`, uses 0–23 hour format; if `false`, uses 12-hour format with AM/PM toggle.          |
| `defaultTime`     | `string/array`  | `null`         | Initial default time in 24h format (`'HH:mm'` for single, or `['HH:mm', 'HH:mm']` for range). |
| `minDate`         | `string/null`   | `null`         | Minimum selectable date in ISO format (`'YYYY-MM-DD'`).                                       |
| `maxDate`         | `string/null`   | `null`         | Maximum selectable date in ISO format (`'YYYY-MM-DD'`).                                       |
| `disableWeekends` | `boolean`       | `false`        | Disables Saturday and Sunday selection when set to `true`.                                    |
| `disabledDates`   | `array`         | `[]`           | List of specific dates to block, e.g., `['2026-08-15', '2026-08-20']`.                        |
| `doubleMonth`     | `boolean`       | `false`        | Renders two consecutive months side-by-side.                                                  |
| `dateFormat`      | `string`        | `'YYYY-MM-DD'` | Output format for the input field (e.g., `'DD/MM/YYYY'`).                                     |
| `lang`            | `string/object` | `'es'`         | Language code (`'es'`, `'en'`) or a custom `i18n` translation object.                         |
| `selectedDates`   | `array`         | `[]`           | Initial dates in `YYYY-MM-DD` format, e.g., `['2026-10-15']`. See Setting a Default Date above. |
| `actions`         | `array`         | `['close', 'today', 'now', 'clear']` | Visible footer buttons in the specified order. Use `[]` to hide all actions. |

Date limits accept ISO strings or `null`, not `Date` objects. Invalid limits, a minimum later than the maximum, and unsupported modes throw an error. `today` is shown with the calendar, `now` with the clock, and `close` closes input dropdowns.

---

## 🔄 Callbacks / Events

| Callback | Default | Parameters and behavior |
| --- | --- | --- |
| `onOpen` | No-op function | No arguments. Runs when the picker opens. `this` is the target element. |
| `onClose` | No-op function | No arguments. Runs when the picker closes, including when another input picker opens. `this` is the target element. |
| `onSelectDate` | `null` | `(dateObj, formattedDates)`: a `Date` for single/birthday, an array of dates for range/multiple, and an array of formatted strings. Clear returns `(null, [])`. Today also invokes this callback. |
| `onSelectTime` | `null` | `(timeState)`: `{ hour, minute }` in 24-hour mode, with `ampm` in 12-hour mode. Range mode returns an array with start and end times. |

```javascript
$("#my-datepicker").extendedDateTimePicker({
  onOpen: function () {
    console.log("Picker opened");
  },
  onClose: function () {
    console.log("Picker closed");
  },
  onSelectDate: function (dateObj, formattedDates) {
    console.log("Date Object:", dateObj);
    console.log("Formatted Dates:", formattedDates);
  },
  onSelectTime: function (timeState) {
    console.log("Selected Time:", timeState); // Returns an object for single mode, or an array of objects [{hour, minute, ampm}, {hour, minute, ampm}] for range mode
  },
});
```

---

## 🛠️ Public Methods (API)

You can manually trigger actions or clean up via instance methods:

```javascript
// Open manually
$("#my-datepicker").extendedDateTimePicker("open");

// Close manually
$("#my-datepicker").extendedDateTimePicker("close");

// Destroy instance and remove event listeners
$("#my-datepicker").extendedDateTimePicker("destroy");
```

These methods preserve jQuery chaining. Calling a supported method on an uninitialized element does nothing. Unknown method names throw an error.

---

## 🎂 Birthday Mode (`birthday`)

The `birthday` mode replaces the traditional calendar view with direct numeric selectors for day, month, and year, making it fast and easy to pick distant birth dates:

```javascript
$("#birthday-input").extendedDateTimePicker({
  mode: "birthday",
  showClock: false,
  dateFormat: "DD/MM/YYYY",
});
```

---

## 🌍 Language Customization (i18n)

You can pass a custom translation object directly into the `lang` option to support additional languages:

Partial objects are merged with Spanish defaults. Unknown language codes also fall back to Spanish. Use `calendar.weekdaysShort` for weekday labels; accessible control labels use `calendar.title`, `calendar.previous`, `calendar.next`, and the `increase`/`decrease` keys in `clock` and `birthday`.

```javascript
$("#my-datepicker").extendedDateTimePicker({
  lang: {
    calendar: {
      months: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      monthsShort: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      weekdaysShort: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
      rangeSeparator: "to",
    },
    clock: {
      title: "Clock",
      hour: "Hour",
      minute: "Minute",
      ampm: "AM / PM",
      start: "Start Time",
      end: "End Time",
    },
    birthday: {
      title: "Date of Birth",
      day: "Day",
      month: "Month",
      year: "Year",
    },
    actions: { today: "Today", now: "Now", clear: "Clear" },
  },
});
```

## Value and events

Initial selections use valid ISO dates and honor blocking rules. Initialization does not emit selection callbacks or form events. An existing input value is preserved when no initial selection is supplied. Clear empties the value and controls; the next edit restores the controls from their last valid state. User changes emit input and change when the value changes. Today invokes onSelectDate. Birthday years are limited to 1900 through the current year and also honor configured date restrictions. Range restrictions apply to endpoints; blocked days inside a range are permitted.

For bundlers, import 'jquery-extended-datetimepicker' and its CSS separately. For script tags, keep using the existing dist JavaScript files.

```javascript
import $ from 'jquery';
import 'jquery-extended-datetimepicker';
import 'jquery-extended-datetimepicker/dist/jquery.extended.datetimepicker.min.css';
```

## Keyboard Support

Tab moves between controls. Within the displayed calendar, left/right arrows move by one day and up/down arrows by one week, skipping disabled dates. Enter or Space selects a focused day. Escape closes an input dropdown and returns focus to its input.

## Development and Playground

```sh
npm run build
npm test
npx serve docs
```

If the environment prevents test subprocesses from starting, use `node --test --test-isolation=none` with a Node version supporting that option.

The playground applies configuration to both an input and an inline container. Its default date field accepts ISO dates separated by commas. Clicking Apply Configuration recreates both instances; leaving the date field empty removes the previous input value and preselection.

The README is the source for the playground documentation. Run `npm run docs:sync` after editing it; `npm run build` also synchronizes the documentation.

The options and callbacks tables are shared with the playground. Run `npm run docs:sync` after editing these tables; `npm run build` also synchronizes them. Other documentation sections are maintained separately.

---

## 🔄 Changelog & Recent Updates

### 3 October 2026

- **Calendar navigation**: Fixed month skipping when navigating from dates near the end of a month.
- **Multiple instances**: Opening another input picker now closes the previous instance through its API, keeping visibility, state, and callbacks consistent.
- **Date validation**: Centralized ISO date validation and blocking rules for calendar selections, initial dates, and Today. Invalid date limits and unsupported modes report errors.
- **Initial selection and clearing**: Preselected dates populate the input with or without the clock. Initialization avoids selection callbacks and form events. Clear empties the input and the birthday and clock controls.
- **Birthday mode**: Initial dates and configured restrictions are honored. Editing the year clamps the day to a valid date before notifying consumers.
- **Form integration and cleanup**: User value changes emit input and change events; Today invokes onSelectDate. Destroy restores the original input attributes and removes the instance from the picker registry.
- **Keyboard and accessible controls**: Calendar days use buttons with selected and disabled states. Added accessible control labels, arrow-key movement within the displayed calendar, and Escape to close input dropdowns.
- **Layout and translations**: Adjusted dropdown width constraints, added translated navigation labels, merged partial translations with defaults, and corrected the documented weekdaysShort key.
- **npm distribution**: Added an ESM bundle importing jQuery, while preserving the browser script bundles. Regenerated dist and playground assets.
- **Regression coverage**: Added four tests covering strict dates, leap years, month navigation, blocking rules, and calendar button markup.
- **Documentation and playground**: Added default-date examples and a playground field for one or more initial dates. Options and callbacks tables now synchronize from the README, while other playground documentation remains independent.

*Updated on 3 October 2026.*

---

## 👤 Author & Credits

Created and maintained by **Brayan Pineda Méndez / PinedaMB**.

---

## 📄 License

This project is licensed under the **MIT** License. See the `LICENSE` file for details.