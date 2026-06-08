'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadConfig, type TileConfig } from '@/lib/tile-config';
import { useTranslation } from '@/lib/i18n';
import { TileWizard } from '../../TileWizard';

export default function EditTilePage() {
  const params = useParams();
  const tileId = params.tileId as string;
  const { t } = useTranslation();
  const [tile, setTile] = useState<TileConfig | null | undefined>(undefined);

  useEffect(() => {
    const config = loadConfig();
    setTile(config.tiles.find((t) => t.tileId === tileId) ?? null);
  }, [tileId]);

  if (tile === undefined) {
    return <div className="min-h-screen bg-[#0c0c16]" />;
  }

  if (tile === null) {
    return (
      <div className="min-h-screen bg-[#0c0c16] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#8080cc] mb-4">{t('setup.tile_not_found')}</p>
          <Link href="/setup" className="text-indigo-400 text-sm">
            ← {t('setup.back_to_setup')}
          </Link>
        </div>
      </div>
    );
  }

  return <TileWizard mode="edit" existingTile={tile} />;
}
