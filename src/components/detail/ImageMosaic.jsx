export default function ImageMosaic({ images, title, onViewAll }) {
  const large = images[0];
  const gridImages = images.slice(1, 5);
  while (gridImages.length < 4) {
    gridImages.push(null);
  }

  return (
    <div className="relative flex h-[420px] gap-2">
      <div className="h-full w-[60%] overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-border)]">
        {large ? (
          <img src={large.original || large.large2x} alt={large.alt || title} className="h-full w-full object-cover object-center" />
        ) : null}
      </div>
      <div className="grid h-full w-[40%] grid-cols-2 grid-rows-2 gap-2">
        {gridImages.map((image, index) => (
          <div key={image?.id || index} className="h-full w-full overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-border)]">
            {image ? (
              <img src={image.original || image.large2x} alt={image.alt || title} className="h-full w-full object-cover object-center" />
            ) : null}
          </div>
        ))}
      </div>
      {images.length > 0 ? (
        <button
          type="button"
          onClick={onViewAll}
          className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/75"
        >
          View all {images.length} photos
        </button>
      ) : null}
    </div>
  );
}
