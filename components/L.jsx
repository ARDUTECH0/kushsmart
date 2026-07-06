// Renders both language variants; CSS (html[lang]) shows the active one. Server
// component — no JS needed, so both languages are in the HTML (good for SEO) and
// switching is instant with no re-render. `tag` picks the wrapping element.
export default function L({ ar, en, tag: Tag = 'span', ...rest }) {
  return (
    <>
      <Tag data-ar="" {...rest}>{ar}</Tag>
      <Tag data-en="" {...rest}>{en}</Tag>
    </>
  );
}
