# Extended DateTimePicker (jQuery Plugin)

A modern, responsive, and internationalizable date and time picker plugin built for **jQuery** and optimized for **Bootstrap 5**. Designed to be highly customizable, featuring support for date ranges, multiple selection, birthday mode, advanced date blocking rules, layout control, and 12-hour or 24-hour time format support.

## 🔗 Live Demo

You can test the plugin live here: [View Interactive Demo](https://pinedamb.github.io/extended_datetimepicker/)

---

## 🚀 Features

- **Date Selection Modes**: `single`, `range`, `multiple`, and `birthday`.

- **Flexible Layouts (`layout`)**: Supports both **vertical** and **horizontal** orientations to fit seamlessly into different UI designs.

- **Dual Month View (`doubleMonth`)**: Displays two consecutive months to streamline range selection.

- **Integrated Clock**: Intuitive hour and minute selection with support for **12-hour (with AM/PM)** or **24-hour military** format (`format24h`).

- **Responsive Adaptability**: Automatic fluid scaling and layout wrapping on mobile devices and narrow containers.
- **Fine-Grained Date Control**: Support for date limits (`minDate`, `maxDate`), weekend blocking (`disableWeekends`), and specific date disabling (`disabledDates`).

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
/>;
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
  lang: "es",
});
```

---

## ⚙️ Configurable Options Table

| Option            | Type            | Default        | Description / Allowed Values                                                         |
| ----------------- | --------------- | -------------- | ------------------------------------------------------------------------------------ |
| `mode`            | `string`        | `'single'`     | Selection mode: `'single'`, `'range'`, `'multiple'`, or `'birthday'`.                |
| `layout`          | `string`        | `'vertical'`   | Panel orientation: `'vertical'` or `'horizontal'`.                                   |
| `showCalendar`    | `boolean`       | `true`         | Shows or hides the calendar section.                                                 |
| `showClock`       | `boolean`       | `true`         | Shows or hides the clock section.                                                    |
| `themeColor`      | `string`        | `'success'`    | Bootstrap color theme (e.g., `'primary'`, `'success'`, `'danger'`).                  |
| `format24h`       | `boolean`       | `true`         | If `true`, uses 0–23 hour format; if `false`, uses 12-hour format with AM/PM toggle. |
| `minDate`         | `string/null`   | `null`         | Minimum selectable date in ISO format (`'YYYY-MM-DD'`).                              |
| `maxDate`         | `string/null`   | `null`         | Maximum selectable date in ISO format (`'YYYY-MM-DD'`).                              |
| `disableWeekends` | `boolean`       | `false`        | Disables Saturday and Sunday selection when set to `true`.                           |
| `disabledDates`   | `array`         | `[]`           | List of specific dates to block, e.g., `['2026-08-15', '2026-08-20']`.               |
| `doubleMonth`     | `boolean`       | `false`        | Renders two consecutive months side-by-side.                                         |
| `dateFormat`      | `string`        | `'YYYY-MM-DD'` | Output format for the input field (e.g., `'DD/MM/YYYY'`).                            |
| `lang`            | `string/object` | `'es'`         | Language code (`'es'`, `'en'`) or a custom `i18n` translation object.                |
| `selectedDates`   | `array`         | `[]`           | List of initial pre-selected dates.                                                  |

---

## 🔄 Callbacks / Events

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
    console.log("Selected Time:", timeState); // { hour: 14, minute: 30, ampm: 'PM' }
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
      daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
      rangeSeparator: "to",
    },
    clock: { title: "Clock", hour: "Hour", minute: "Minute", ampm: "AM / PM" },
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

---

## 👤 Author & Credits

Created and maintained by **Brayan Pineda Méndez / PinedaMB**.

---

## 📄 License

This project is licensed under the **MIT** License. See the `LICENSE` file for details.
