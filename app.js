let DATA = [];
let lastImage = null;

const $ = id => document.getElementById(id);

function money(value) {
  return "₹" + Math.round(Number(value) || 0).toLocaleString("en-IN");
}

async function load() {
  try {
    const response = await fetch("data/prices.json");
    DATA = await response.json();

    const model = $("model");
    model.innerHTML = '<option value="">SELECT MODEL / VARIANT</option>';

    DATA.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = item.model;
      model.appendChild(option);
    });

    $("date").value = new Date().toISOString().slice(0, 10);

    update();
  } catch (error) {
    console.error(error);
  }
}

function selected() {
  const index = Number($("model").value);
  return DATA[index];
}

function isTour(model) {
  return /TOUR/i.test(model.model);
}

function validCsd(model) {
  return typeof model.csd === "number" && Number.isFinite(model.csd);
}

function validBh(model) {
  return typeof model.bhFinalTax === "number" &&
         Number.isFinite(model.bhFinalTax);
}

function syncOptions() {
  const model = selected();

  if (!model) return;

  const priceType = $("priceType");
  const passing = $("passing");

  [...priceType.options].forEach(option => {
    option.disabled =
      option.value === "CSD AMOUNT" && !validCsd(model);
  });

  if (priceType.selectedOptions[0]?.disabled) {
    priceType.value = "INDIVIDUAL";
  }

  [...passing.options].forEach(option => {
    option.disabled =
      option.value === "BH PASSING" && !validBh(model);
  });

  if (passing.selectedOptions[0]?.disabled) {
    passing.value = "MH PASSING";
  }
}

function calculate() {
  const model = selected();

  if (!model) return null;

  syncOptions();

  const csd = $("priceType").value === "CSD AMOUNT";
  const bh = $("passing").value === "BH PASSING";

  const exShowroom = csd ? model.csd : model.exShowroom;
  const rto = bh ? model.bhFinalTax : model.rtoTax;

  // CSD quotation मध्ये TCS = 0
  const tcs = csd ? 0 : model.tcs;

  const accessories =
    Number($("accessories").value) || 0;

  const discount =
    Number($("discount").value) || 0;

  const values = [
    exShowroom,
    model.insurance,
    rto,
    model.registrationFees,
    model.msp,
    model.smp,
    model.fastag,
    model.hsrp,
    model.autoCard,
    tcs,
    accessories
  ];

  const total = values.reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  );

  return {
    model,
    csd,
    bh,
    values,
    total,
    discount,
    finalTotal: total - discount,

    insuranceLabel: isTour(model)
      ? "INSURANCE 1 YEAR ZERO DEP (APPROX)"
      : "INSURANCE 1+3 (APPROX)",

    registrationLabel: isTour(model)
      ? "GPS, PANIC BUTTON, REDIUM"
      : "REGISTRATION FEES"
  };
}

function update() {
  const result = calculate();

  if (!result) {
    $("ex").value = "";
    $("ins").value = "";
    $("rto").value = "";
    $("reg").value = "";
    $("msp").value = "";
    $("smp").value = "";
    $("fastag").value = "";
    $("hsrp").value = "";
    $("auto").value = "";
    $("tcs").value = "";

    $("total").textContent = "₹0";
    $("final").textContent = "₹0";

    return;
  }

  const [
    ex,
    insurance,
    rto,
    registration,
    msp,
    smp,
    fastag,
    hsrp,
    autoCard,
    tcs,
    accessories
  ] = result.values;

  $("ex").value = Math.round(ex || 0);
  $("ins").value = Math.round(insurance || 0);
  $("rto").value = Math.round(rto || 0);
  $("reg").value = Math.round(registration || 0);
  $("msp").value = Math.round(msp || 0);
  $("smp").value = Math.round(smp || 0);
  $("fastag").value = Math.round(fastag || 0);
  $("hsrp").value = Math.round(hsrp || 0);
  $("auto").value = Math.round(autoCard || 0);
  $("tcs").value = Math.round(tcs || 0);

  $("insLabel").textContent = result.insuranceLabel;
  $("regLabel").textContent = result.registrationLabel;

  $("total").textContent = money(result.total);
  $("final").textContent = money(result.finalTotal);
}

function makeQuotationImage(result) {
  const canvas = document.createElement("canvas");

  canvas.width = 805;
  canvas.height = 1065;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 803, 1063);

  ctx.textAlign = "center";
  ctx.fillStyle = "#000000";

  ctx.font = "bold 20px Arial";
  ctx.fillText(
    "PROFORMA INVOICE",
    402,
    105
  );

  ctx.font = "bold 15px Arial";
  ctx.fillText(
    "MAHALAXMI AUTOMOTIVES PVT. LTD.",
    402,
    130
  );

  ctx.textAlign = "left";

  ctx.font = "bold 15px Arial";

  ctx.fillText(
    "NAME : " + ($("customer").value || ""),
    20,
    170
  );

  ctx.fillText(
    "ADDRESS : " + ($("address").value || ""),
    20,
    200
  );

  ctx.fillText(
    "Mobile No. : " + ($("mobile").value || ""),
    20,
    230
  );

  ctx.fillText(
    "MODEL & VARIENT : " + result.model.model,
    20,
    265
  );

  const labels = [
    "EX-SHOWROOM PRICE",
    result.insuranceLabel,
    "RTO TAX (" + $("passing").value + ")",
    result.registrationLabel,
    "MSP+ (6 YEAR WARRANTY + CCP)",
    "SMP",
    "FASTAG",
    "HSRP + NUMBER PLATE GARNISH",
    "AUTO CARD",
    "TCS",
    "ACCESSORIES"
  ];

  const x1 = 55;
  const x2 = 560;
  const startY = 315;
  const rowHeight = 42;

  ctx.font = "bold 14px Arial";

  labels.forEach((label, i) => {
    const y = startY + i * rowHeight;

    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(x1, y + 10);
    ctx.lineTo(750, y + 10);
    ctx.stroke();

    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.fillText(label, x1, y);

    ctx.textAlign = "right";
    ctx.fillText(
      money(result.values[i]),
      745,
      y
    );
  });

  const totalY = startY + labels.length * rowHeight + 5;

  ctx.fillStyle = "#c6d9f0";
  ctx.fillRect(50, totalY - 25, 700, 42);

  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  ctx.font = "bold 18px Arial";
  ctx.fillText("TOTAL", x1, totalY);

  ctx.textAlign = "right";
  ctx.fillText(
    money(result.total),
    745,
    totalY
  );

  ctx.textAlign = "left";
  ctx.font = "bold 15px Arial";
  ctx.fillText(
    "DISCOUNT",
    x1,
    totalY + 55
  );

  ctx.textAlign = "right";
  ctx.fillText(
    money(result.discount),
    745,
    totalY + 55
  );

  ctx.fillStyle = "#c6d9f0";
  ctx.fillRect(50, totalY + 75, 700, 45);

  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  ctx.font = "bold 20px Arial";
  ctx.fillText(
    "TOTAL",
    x1,
    totalY + 105
  );

  ctx.textAlign = "right";
  ctx.fillText(
    money(result.finalTotal),
    745,
    totalY + 105
  );

  ctx.textAlign = "left";
  ctx.font = "bold 14px Arial";

  ctx.fillText(
    "ACCOUNT DETAILS:",
    20,
    840
  );

  ctx.font = "13px Arial";

  ctx.fillText(
    "NAME : Mahalaxmi Automotives PVT.LTD.",
    20,
    865
  );

  ctx.fillText(
    "BANK NAME : HDFC Bank LTD",
    20,
    885
  );

  ctx.fillText(
    "ACCOUNT NO : 01032560004762",
    20,
    905
  );

  ctx.fillText(
    "BRANCH : FC Road Pune",
    20,
    925
  );

  ctx.fillText(
    "IFSC CODE : HDFC0000103",
    20,
    945
  );

  ctx.font = "bold 13px Arial";

  ctx.fillText(
    "VISHAL BORAWANE",
    20,
    985
  );

  ctx.fillStyle = "blue";

  ctx.fillText(
    "9604991203",
    20,
    1005
  );

  ctx.fillStyle = "#000000";

  ctx.textAlign = "center";

  ctx.fillText(
    "For MAHALAXMI AUTOMOTIVES PVT.LTD.",
    402,
    1030
  );

  return canvas.toDataURL("image/png");
}

function generate() {
  const result = calculate();

  if (!result) {
    alert("Please select Model & Variant");
    return;
  }

  lastImage = makeQuotationImage(result);

  $("share").disabled = false;

  if ($("status")) {
    $("status").textContent =
      "Quotation image तयार आहे.";
  }

  if (window.Android) {
    window.Android.saveImage(lastImage);
  }
}

async function share() {
  if (!lastImage) {
    generate();
    return;
  }

  try {
    if (navigator.share) {
      const response =
        await fetch(lastImage);

      const blob =
        await response.blob();

      const file =
        new File(
          [blob],
          "quotation.png",
          { type: "image/png" }
        );

      await navigator.share({
        title: "Quotation",
        files: [file]
      });

      return;
    }
  } catch (error) {
    console.log(error);
  }

  if (window.Android) {
    window.Android.shareImage(lastImage);
    return;
  }

  const link =
    document.createElement("a");

  link.href = lastImage;
  link.download = "quotation.png";
  link.click();
}

$("model").addEventListener("change", update);
$("priceType").addEventListener("change", update);
$("passing").addEventListener("change", update);

[
  "accessories",
  "discount",
  "customer",
  "address",
  "mobile",
  "date"
].forEach(id => {
  $(id).addEventListener("input", update);
});

$("generate").addEventListener(
  "click",
  generate
);

$("share").addEventListener(
  "click",
  share
);

load();
