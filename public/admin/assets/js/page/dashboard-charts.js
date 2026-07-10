"use strict";

(function () {
  var dataEl = document.getElementById("dashboard-chart-data");
  if (!dataEl || typeof ApexCharts === "undefined") return;

  var data = {
    verifiedUsers: Number(dataEl.dataset.verifiedUsers || 0),
    unverifiedUsers: Number(dataEl.dataset.unverifiedUsers || 0),
    pendingTopUps: Number(dataEl.dataset.pendingTopups || 0),
    completedTopUps: Number(dataEl.dataset.completedTopups || 0),
    todayRevenue: Number(dataEl.dataset.todayRevenue || 0),
    weeklyRevenue: Number(dataEl.dataset.weeklyRevenue || 0),
    monthlyRevenue: Number(dataEl.dataset.monthlyRevenue || 0),
    yearlyRevenue: Number(dataEl.dataset.yearlyRevenue || 0)
  };

  var ink = { primary: "#0b0b0b", secondary: "#52514e", muted: "#898781" };
  var status = { good: "#0ca30c", warning: "#fab219" };
  var sequentialBlue = ["#6da7ec", "#3987e5", "#256abf", "#104281"];

  var fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  function nairaFormatter(value) {
    return "₦" + Number(value || 0).toLocaleString();
  }

  function renderDonut(selector, title, labels, series, colors) {
    var el = document.querySelector(selector);
    if (!el) return;
    var total = series.reduce(function (a, b) { return a + b; }, 0);

    new ApexCharts(el, {
      chart: {
        type: "donut",
        height: 300,
        fontFamily: fontFamily
      },
      series: series,
      labels: labels,
      colors: colors,
      stroke: { width: 2, colors: ["#fcfcfb"] },
      dataLabels: {
        enabled: true,
        formatter: function (val) { return Math.round(val) + "%"; },
        style: { fontSize: "12px" }
      },
      legend: {
        position: "bottom",
        labels: { colors: ink.secondary },
        markers: { radius: 3 }
      },
      tooltip: {
        custom: function (opts) {
          var label = opts.w.globals.labels[opts.seriesIndex];
          var value = opts.series[opts.seriesIndex];
          var color = opts.w.globals.colors[opts.seriesIndex];
          return (
            '<div style="background:#fcfcfb;border:1px solid #e1e0d9;border-radius:5px;' +
            'box-shadow:2px 2px 6px -4px #999;padding:6px 10px;font-size:13px;' +
            'font-family:' + fontFamily + ';white-space:nowrap;">' +
            '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;' +
            'background:' + color + ';margin-right:6px;"></span>' +
            '<span style="color:' + ink.secondary + ';">' + label + ':</span> ' +
            '<strong style="color:' + ink.primary + ';">' + value.toLocaleString() + '</strong>' +
            '</div>'
          );
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              total: {
                show: true,
                label: title,
                color: ink.muted,
                formatter: function () { return total.toLocaleString(); }
              },
              value: { color: ink.primary }
            }
          }
        }
      },
      noData: { text: "No data yet" }
    }).render();
  }

  renderDonut(
    "#chart-user-verification",
    "Total Users",
    ["Verified", "Unverified"],
    [data.verifiedUsers, data.unverifiedUsers],
    [status.good, status.warning]
  );

  renderDonut(
    "#chart-topup-status",
    "Total Top-Ups",
    ["Completed", "Pending"],
    [data.completedTopUps, data.pendingTopUps],
    [status.good, status.warning]
  );

  var revenueEl = document.querySelector("#chart-revenue-period");
  if (revenueEl) {
    new ApexCharts(revenueEl, {
      chart: {
        type: "bar",
        height: 300,
        fontFamily: fontFamily,
        toolbar: { show: false }
      },
      series: [{
        name: "Revenue",
        data: [data.todayRevenue, data.weeklyRevenue, data.monthlyRevenue, data.yearlyRevenue]
      }],
      colors: sequentialBlue,
      plotOptions: {
        bar: {
          distributed: true,
          columnWidth: "45%",
          borderRadius: 4,
          dataLabels: { position: "top" }
        }
      },
      dataLabels: {
        enabled: true,
        offsetY: -20,
        formatter: nairaFormatter,
        style: { colors: [ink.secondary], fontSize: "12px" }
      },
      legend: { show: false },
      xaxis: {
        categories: ["Today", "This Week", "This Month", "This Year"],
        labels: { style: { colors: ink.secondary } },
        axisBorder: { color: "#c3c2b7" },
        axisTicks: { color: "#c3c2b7" }
      },
      yaxis: {
        labels: {
          style: { colors: ink.muted },
          formatter: nairaFormatter
        }
      },
      grid: {
        borderColor: "#e1e0d9",
        strokeDashArray: 0,
        padding: { top: 30 }
      },
      tooltip: {
        y: { formatter: nairaFormatter }
      },
      noData: { text: "No data yet" }
    }).render();
  }
})();
