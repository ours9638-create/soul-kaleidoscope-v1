(function (global) {
  "use strict";

  const SCHEMA_VERSION = "1.0.0";

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const finalNumber = (chain) => Number(String(chain || "").split("/").at(-1));
  const isoTime = (hour, minute) => `${String(Number(hour)).padStart(2, "0")}:${String(Number(minute)).padStart(2, "0")}`;

  function build({ input, result, engineVersion, generatedAt = new Date().toISOString(), profileId = null }) {
    if (!input || !result) throw new TypeError("建立統一資料模型時缺少 input 或 result");

    const solarStages = clone(result.solarSoul || []);
    const lunarStages = clone(result.lunarSoul || []);

    return {
      meta: {
        schemaVersion: SCHEMA_VERSION,
        engineVersion: String(engineVersion || "unknown"),
        generatedAt,
        profileId
      },
      subject: {
        name: input.name || "未填姓名"
      },
      source: {
        solarBirthDate: input.solarBirth.dateString,
        birthTime: isoTime(input.time.inputHour, input.time.minute),
        calculationHour: input.time.calculationHour,
        queryDate: input.queryDate,
        lunarBirth: {
          year: input.lunarBirth.year,
          month: input.lunarBirth.month,
          day: input.lunarBirth.day,
          leap: Boolean(input.lunarBirth.leap),
          calculationMonth: input.lunarBirth.calculationMonth
        }
      },
      calendar: {
        queryLunar: result.queryLunar ? clone(result.queryLunar) : null,
        solar: {
          birthdayStatus: result.solarFlow.status,
          annualBirthdayDate: result.solarFlow.birthdayGregorianDate,
          adoptedYear: result.solarFlow.adoptedYear
        },
        lunar: {
          birthdayStatus: result.lunarFlow.status,
          annualBirthdayDate: result.lunarFlow.birthdayGregorianDate,
          annualBirthdayLunarYear: result.lunarFlow.birthdayLunarYear || null,
          adoptedYear: result.lunarFlow.adoptedYear || null,
          needsReview: Boolean(result.lunarFlow.needsReview)
        }
      },
      numerology: {
        solar: {
          soulStages: solarStages,
          primaryNumber: solarStages[2] ? finalNumber(solarStages[2].chain) : null,
          flow: clone(result.solarFlow),
          horse: clone(result.solarHorse)
        },
        lunar: {
          soulStages: lunarStages,
          primaryNumber: lunarStages[2] ? finalNumber(lunarStages[2].chain) : null,
          flow: clone(result.lunarFlow),
          horse: clone(result.lunarHorse)
        }
      },
      outputs: {
        report: null,
        soulKaleidoscope: null
      }
    };
  }

  function validate(profile) {
    const errors = [];
    if (!profile || typeof profile !== "object") return { ok: false, errors: ["profile 必須是物件"] };
    if (profile.meta?.schemaVersion !== SCHEMA_VERSION) errors.push(`schemaVersion 必須為 ${SCHEMA_VERSION}`);
    if (!profile.subject?.name) errors.push("subject.name 不可為空");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.source?.solarBirthDate || "")) errors.push("source.solarBirthDate 格式錯誤");
    if (!/^\d{2}:\d{2}$/.test(profile.source?.birthTime || "")) errors.push("source.birthTime 格式錯誤");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.source?.queryDate || "")) errors.push("source.queryDate 格式錯誤");
    if (!Array.isArray(profile.numerology?.solar?.soulStages) || profile.numerology.solar.soulStages.length !== 5) errors.push("國曆 soulStages 必須有 5 階段");
    if (!Array.isArray(profile.numerology?.lunar?.soulStages) || profile.numerology.lunar.soulStages.length !== 5) errors.push("農曆 soulStages 必須有 5 階段");
    return { ok: errors.length === 0, errors };
  }

  global.SoulKaleidoscopeProfile = { SCHEMA_VERSION, build, validate, finalNumber };
  if (typeof module !== "undefined" && module.exports) module.exports = global.SoulKaleidoscopeProfile;
})(globalThis);
