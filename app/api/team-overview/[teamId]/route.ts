import { NextResponse } from 'next/server';
import { getMlbTeamOverview } from '@/app/lib/mlbApi';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const resolvedParams = await params;
    const teamId = Number.parseInt(resolvedParams.teamId, 10);

    if (Number.isNaN(teamId)) {
      return NextResponse.json({ error: 'El teamId no es valido.' }, { status: 400 });
    }

    const overview = await getMlbTeamOverview(teamId);
    return NextResponse.json(overview);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No fue posible cargar el dashboard MLB.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
