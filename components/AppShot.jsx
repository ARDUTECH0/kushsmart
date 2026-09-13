import { asset } from '@/lib/site';

/**
 * A real app screenshot in the drawn phone frame.
 *
 * The images are captured from the app's demo mode (lib/util/demo_mode.dart):
 * an invented home with an invented name, so no customer's devices or account
 * details can ever appear on the site. The Android status bar is cropped off.
 *
 * name: file in /assets/screens without extension, e.g. "app-home".
 */
export default function AppShot({ name, alt }) {
  return (
    <div className="mk-phone shot">
      <span className="mk-notch" aria-hidden="true" />
      <div className="mk-screen mk-shot">
        <img
          src={asset(`/assets/screens/${name}.webp`)}
          alt={alt}
          width="540"
          height="921"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}
