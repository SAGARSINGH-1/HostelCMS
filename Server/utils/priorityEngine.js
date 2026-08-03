export const getPriority = (
    title = "",
    description = "",
    supportCount = 1,
    scope = "room"
) => {
    const text = `${title} ${description}`.toLowerCase();
    let score = 0;

    // Severity / urgency
    if (/fire|short circuit|spark|blast|explosion|smoke/.test(text)) score += 5;
    if (/water leak|flood|overflow|seepage/.test(text)) score += 4;
    if (/no electricity|power cut|blackout/.test(text)) score += 4;

    if (/internet slow|wifi issue|network|no internet/.test(text)) score += 2;
    if (/mess food|dirty|unclean|bad food/.test(text)) score += 2;

    if (/light flicker|minor|small issue/.test(text)) score += 1;

    // Support / duplicate impact
    if (supportCount >= 10) score += 4;
    else if (supportCount >= 6) score += 3;
    else if (supportCount >= 3) score += 2;
    else if (supportCount >= 2) score += 1;

    // Scope / impact
    if (scope === "campus") score += 4;
    else if (scope === "hostel") score += 3;
    else if (scope === "block") score += 2;
    else if (scope === "floor") score += 1;
    else score += 0;

    // Strong urgent phrases
    if (/urgent|immediately|emergency|danger|unsafe|asap/.test(text)) score += 2;

    if (score >= 10) return "urgent";
    if (score >= 7) return "high";
    if (score >= 4) return "medium";
    return "low";
};