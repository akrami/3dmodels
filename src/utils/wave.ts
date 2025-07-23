export function createWavyShape(
  oc: any,
  radius: number,
  amplitude: number,
  density: number,
  depth: number,
  segments = 1024,
) {
  const k = Math.round(radius * density);
  const rOuter = (t: number) => radius + amplitude - Math.abs(Math.sin(k * t));
  const rInner = radius - (amplitude + 4);

  const outer = new oc.BRepBuilderAPI_MakePolygon_1();
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const r = rOuter(t);
    outer.Add_1(new oc.gp_Pnt_3(r * Math.cos(t), r * Math.sin(t), 0));
  }
  outer.Close();
  const outerWire = outer.Wire();

  const inner = new oc.BRepBuilderAPI_MakePolygon_1();
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    inner.Add_1(new oc.gp_Pnt_3(rInner * Math.cos(t), rInner * Math.sin(t), 0));
  }
  inner.Close();
  const innerWire = inner.Wire();

  const faceMaker = new oc.BRepBuilderAPI_MakeFace_15(outerWire, true);
  faceMaker.Add(innerWire);
  const face = faceMaker.Face();

  const vec = new oc.gp_Vec_4(0, 0, depth);
  const prism = new oc.BRepPrimAPI_MakePrism_2(face, vec, true, false);
  return prism.Shape();
}

