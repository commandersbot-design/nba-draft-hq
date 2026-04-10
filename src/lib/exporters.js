function escapeCsv(value) {
  const stringValue = String(value ?? '');
  if (!/[",\n]/.test(stringValue)) return stringValue;
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function triggerDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function timestampSuffix() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export function downloadJson(filenameBase, data) {
  triggerDownload(
    `${filenameBase}-${timestampSuffix()}.json`,
    `${JSON.stringify(data, null, 2)}\n`,
    'application/json;charset=utf-8',
  );
}

export function downloadCsv(filenameBase, rows) {
  if (!rows.length) {
    triggerDownload(
      `${filenameBase}-${timestampSuffix()}.csv`,
      '',
      'text/csv;charset=utf-8',
    );
    return;
  }

  const columns = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set()));

  const lines = [
    columns.map(escapeCsv).join(','),
    ...rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(',')),
  ];

  triggerDownload(
    `${filenameBase}-${timestampSuffix()}.csv`,
    `${lines.join('\n')}\n`,
    'text/csv;charset=utf-8',
  );
}

export function buildNotesExportRows(notes, prospectsById) {
  return notes.map((note) => ({
    noteId: note.id,
    playerId: note.playerId,
    playerName: prospectsById[note.playerId]?.name || 'Unknown prospect',
    quickSummary: note.quickSummary,
    strengths: note.strengths,
    weaknesses: note.weaknesses,
    projection: note.projection,
    context: note.context,
    freeform: note.freeform,
    tags: (note.tags || []).join('|'),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }));
}

export function buildBoardExportRows(boardProspects) {
  return boardProspects.map((prospect, index) => ({
    customOrder: index + 1,
    rank: prospect.rank,
    id: prospect.id,
    name: prospect.name,
    position: prospect.position,
    school: prospect.school,
    tier: prospect.tier,
    archetype: prospect.archetype,
    roleProjection: prospect.roleProjection,
    riskLevel: prospect.riskLevel,
    overallComposite: prospect.overallComposite,
    offenseScore: prospect.offenseScore,
    defenseScore: prospect.defenseScore,
    age: prospect.age,
    measurementLine: prospect.measurementLine,
    tags: (prospect.tags || []).join('|'),
  }));
}
