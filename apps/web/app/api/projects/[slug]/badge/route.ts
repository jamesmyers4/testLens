import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildSvg(label: string, message: string, color: string): string {
  const labelWidth = label.length * 6.5 + 10;
  const messageWidth = message.length * 6.5 + 10;
  const totalWidth = labelWidth + messageWidth;
  const labelX = labelWidth / 2;
  const messageX = labelWidth + messageWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${message}">
  <title>${label}: ${message}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelX}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelX}" y="14">${label}</text>
    <text x="${messageX}" y="15" fill="#010101" fill-opacity=".3">${message}</text>
    <text x="${messageX}" y="14">${message}</text>
  </g>
</svg>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
  });

  const svgHeaders = {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  };

  if (!project) {
    const svg = buildSvg("testLens", "unknown project", "#9f9f9f");
    return new NextResponse(svg, { headers: svgHeaders });
  }

  const run = await prisma.run.findFirst({
    where: { projectId: project.id },
    orderBy: { runAt: "desc" },
  });

  if (!run) {
    const svg = buildSvg("testLens", "no runs yet", "#9f9f9f");
    return new NextResponse(svg, { headers: svgHeaders });
  }

  const message = `${run.passed} passed · ${run.failed} failed · ${run.flaky} flaky`;

  let color: string;
  if (run.failed > 0) {
    color = "#e05d44";
  } else if (run.flaky > 0) {
    color = "#dfb317";
  } else {
    color = "#4c1";
  }

  const svg = buildSvg("testLens", message, color);
  return new NextResponse(svg, { headers: svgHeaders });
}
