import { NextResponse } from 'next/server';
import { getMlbTeams } from '@/app/lib/mlbApi';

export async function GET() {
  try {
    const teams = await getMlbTeams();
    return NextResponse.json(teams);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No fue posible cargar los equipos MLB.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
