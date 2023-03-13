"use strict";
function showValue(e, t = 3, n = 30) {
  switch (typeof e) {
    case "bigint":
    case "boolean":
    case "number":
      return `${e}`;
    case "string":
      return JSON.stringify(e);
    case "object":
      if (null === e) return "null";
      if (Array.isArray(e)) {
        if (0 === t || 0 === n) return "[Array]";
        {
          let r = "[",
            s = 0;
          for (s = 0; s < e.length && n > r.length; s++)
            0 !== s && (r += ", "), (r += showValue(e[s], t - 1, n - r.length));
          return s < e.length && (r += " ... "), (r += "]"), r;
        }
      }
      if ((e => "object" == typeof e && null != e && r in e)(e)) return e.toString();
      if (0 === t) return "{Object}";
      {
        const r = Object.entries(e);
        let s = "{",
          a = 0;
        for (a = 0; a < r.length && n > s.length; a++) {
          0 !== a && (s += ", ");
          const [e, o] = r[a];
          s += `${/\s/.test(e) ? JSON.stringify(e) : e}: ${showValue(o, t - 1, n - s.length)}`;
        }
        return a < r.length && (s += " ... "), (s += "}"), s;
      }
    default:
      return typeof e;
  }
}
function success(e) {
  return { success: !0, value: e };
}
function failure(e, t = {}) {
  return { success: !1, message: e, ...t };
}
function expected(e, t, r = {}) {
  return failure(`Expected ${"string" == typeof e ? e : show(e)}, but was ${showValue(t)}`, r);
}
function unableToAssign(e, t, ...r) {
  return [
    `Unable to assign ${showValue(e)} to ${"string" == typeof t ? t : show(t)}`,
    ...r.map(toFullError),
  ];
}
function andError([e, ...t]) {
  return [`And ${e[0].toLocaleLowerCase()}${e.substr(1)}`, ...t];
}
function typesAreNotCompatible(e, ...t) {
  return [`The types of ${e} are not compatible`, ...t.map(toFullError)];
}
function toFullError(e) {
  return "string" == typeof e ? [e] : Array.isArray(e) ? e : toFullError(e.fullError || e.message);
}
function showError(e) {
  return e.fullError ? showFullError(e.fullError) : e.key ? `${e.message} in ${e.key}` : e.message;
}
function showFullError([e, ...t], r = "") {
  return [`${r}${e}`, ...t.map(e => showFullError(e, `${r}  `))].join("\n");
}
function provideHelpers(e) {
  t = e;
}
function assertRuntype(...e) {
  for (const t of e) if (!t || !t[r]) throw new Error(`Expected Runtype but got ${showValue(t)}`);
}
function create(e, n, s) {
  function safeParse(e) {
    return innerValidate(a, e, createVisitedState(), !1);
  }
  function safeSerialize(e) {
    return innerSerialize(a, e, createVisitedState(), !1);
  }
  const a = {
    ...s,
    tag: e,
    assert(e) {
      const t = innerGuard(a, e, createGuardVisitedState(), !1, !1);
      if (t) throw new ValidationError(t);
    },
    parse(e) {
      const t = safeParse(e);
      if (!t.success) throw new ValidationError(t);
      return t.value;
    },
    safeParse,
    test: e => void 0 === innerGuard(a, e, createGuardVisitedState(), !1, !1),
    serialize(e) {
      const t = safeSerialize(e);
      if (!t.success) throw new ValidationError(t);
      return t.value;
    },
    safeSerialize,
    Or: e => t.Union(a, e),
    And: e => t.Intersect(a, e),
    withConstraint: (e, r) => t.Constraint(a, e, r),
    withGuard: (e, r) => t.Constraint(a, e, r),
    withBrand: e => t.Brand(e, a),
    withParser: e => t.ParsedValue(a, e),
    toString: () => `Runtype<${show(a)}>`,
    [r]: "function" == typeof n ? { p: n } : n,
  };
  return a;
}
function unwrapRuntype(e, t) {
  const n = e[r],
    s = n.u ? n.u(t) : void 0;
  return s && s !== e ? unwrapRuntype(s, t) : e;
}
function createValidationPlaceholder(e, t) {
  return innerMapValidationPlaceholder(e, () => t(e) || success(e));
}
function innerMapValidationPlaceholder(e, t, r, n) {
  let s,
    a = !1;
  const o = {
    success: !0,
    cycle: !0,
    placeholder: e,
    unwrap() {
      if (s) return (a = !0), s;
      s = success(e);
      const i = t(),
        u = i.success && r ? r(i.value) : i;
      if (!u.success) return (s = u);
      if (a) {
        const e = ((e, t) =>
            e === t
              ? success(t)
              : Array.isArray(e) && Array.isArray(t)
              ? (e.splice(0, e.length, ...t), success(e))
              : e &&
                "object" == typeof e &&
                !Array.isArray(e) &&
                t &&
                "object" == typeof t &&
                !Array.isArray(t)
              ? (Object.assign(e, t), success(e))
              : failure(
                  `Cannot convert a value of type "${
                    Array.isArray(e) ? "Array" : typeof e
                  }" into a value of type "${
                    null === t ? "null" : Array.isArray(t) ? "Array" : typeof t
                  }" when it contains cycles.`,
                ))(s.value, u.value),
          t = e.success && n && innerGuard(n, e.value, createGuardVisitedState(), !1, !0);
        s = t || e;
      } else {
        const e = n && innerGuard(n, u.value, createGuardVisitedState(), !1, !0);
        s = e || u;
      }
      return s.success && (o.placeholder = s.value), s;
    },
  };
  return o;
}
function createVisitedState() {
  return new Map();
}
function createGuardVisitedState() {
  return new Map();
}
function innerValidate(e, t, r, n) {
  const s = innerValidateToPlaceholder(e, t, r, n);
  return s.cycle ? s.unwrap() : s;
}
function innerValidateToPlaceholder(e, t, n, s) {
  var a;
  const o = n,
    i = e[r],
    u = null === (a = o.get(e)) || void 0 === a ? void 0 : a.get(t);
  if (void 0 !== u) return u;
  const l = i.p(
    t,
    (e, t, r) => innerValidate(e, t, n, null != r ? r : s),
    (e, t, r) => innerValidateToPlaceholder(e, t, n, null != r ? r : s),
    "p",
    s,
  );
  return l.cycle ? (o.set(e, (o.get(e) || new Map()).set(t, l)), l) : l;
}
function innerSerialize(e, t, r, n) {
  const s = innerSerializeToPlaceholder(e, t, r, n);
  return s.cycle ? s.unwrap() : s;
}
function innerSerializeToPlaceholder(e, t, n, s) {
  var a;
  const o = n,
    i = e[r],
    u = null === (a = o.get(e)) || void 0 === a ? void 0 : a.get(t);
  if (void 0 !== u) return u;
  let l = (i.s || i.p)(
    t,
    (e, t, r) => innerSerialize(e, t, n, null != r ? r : s),
    (e, t, r) => innerSerializeToPlaceholder(e, t, n, null != r ? r : s),
    "s",
    s,
  );
  return l.cycle ? (o.set(e, (o.get(e) || new Map()).set(t, l)), l) : l;
}
function innerGuard(e, t, n, s, a) {
  var o;
  const i = n,
    u = e[r];
  if (t && ("object" == typeof t || "function" == typeof t)) {
    if (null === (o = i.get(e)) || void 0 === o ? void 0 : o.has(t)) return;
    i.set(e, (i.get(e) || new Set()).add(t));
  }
  if (u.t) return u.t(t, (e, t, r) => innerGuard(e, t, n, null != r ? r : s, a), s, a);
  let l = u.p(
    t,
    (e, t, r) => innerGuard(e, t, n, null != r ? r : s, a) || success(t),
    (e, t, r) => innerGuard(e, t, n, null != r ? r : s, a) || success(t),
    "t",
    s,
  );
  return l.cycle && (l = l.unwrap()), l.success ? void 0 : l;
}
function getFields(e, t) {
  const n = unwrapRuntype(e, t)[r];
  return n.f ? n.f(t) : void 0;
}
function Brand(e, t) {
  return (
    assertRuntype(t),
    create(
      "brand",
      { p: (e, r, n) => n(t, e), u: () => t },
      {
        brand: e,
        entity: t,
        show(e) {
          return show(t, e);
        },
      },
    )
  );
}
function Constraint(e, t, r) {
  assertRuntype(e);
  const n = create(
    "constraint",
    {
      p(s, a) {
        const o = r && r.name,
          i = a(e, s);
        if (!i.success) return i;
        const u = t(i.value);
        if (!u || "string" == typeof u) {
          const e = "string" == typeof u ? u : `${showValue(s)} failed ${o || "constraint"} check`;
          return failure(e, { fullError: unableToAssign(s, n, e) });
        }
        return success(i.value);
      },
      u: () => e,
    },
    {
      underlying: e,
      constraint: t,
      name: r && r.name,
      args: r && r.args,
      show(t) {
        return (r && r.name) || `WithConstraint<${show(e, t)}>`;
      },
    },
  );
  return n;
}
function lazyValue(e) {
  let t;
  return () => t || (t = e());
}
function Intersect(...e) {
  assertRuntype(...e);
  const allFieldInfoForMode = t => {
      const r = e.map(e => ({ i: e, f: getFields(e, t) })),
        n = new Map(
          e.map(e => {
            const t = new Set();
            for (const { i: n, f: s } of r)
              if (n !== e) {
                if (void 0 === s) return [e, void 0];
                for (const e of s) t.add(e);
              }
            return [e, t];
          }),
        ),
        s = new Set();
      for (const { f: e } of r) {
        if (void 0 === e) return { intersecteesWithOtherFields: n, allFields: void 0 };
        for (const t of e) s.add(t);
      }
      return { intersecteesWithOtherFields: n, allFields: s };
    },
    t = {
      p: lazyValue(() => allFieldInfoForMode("p")),
      t: lazyValue(() => allFieldInfoForMode("t")),
      s: lazyValue(() => allFieldInfoForMode("s")),
    };
  return create(
    "intersect",
    {
      p(r, n, s, a, o) {
        const i = o
          ? e => {
              const r = t[a]().intersecteesWithOtherFields.get(e);
              return void 0 !== r && { keysFromIntersect: r, deep: o.deep };
            }
          : e => !1;
        if (Array.isArray(r))
          return createValidationPlaceholder([...r], t => {
            for (const r of e) {
              let e = n(r, t, i(r));
              if (!e.success) return e;
              if (!Array.isArray(e.value))
                return failure(
                  `The validator ${show(
                    r,
                  )} attempted to convert the type of this value from an array to something else. That conversion is not valid as the child of an intersect`,
                );
              t.splice(0, t.length, ...e.value);
            }
          });
        if (r && "object" == typeof r)
          return createValidationPlaceholder(Object.create(null), t => {
            for (const s of e) {
              let e = n(s, r, i(s));
              if (!e.success) return e;
              if (!e.value || "object" != typeof e.value)
                return failure(
                  `The validator ${show(
                    s,
                  )} attempted to convert the type of this value from an object to something else. That conversion is not valid as the child of an intersect`,
                );
              Object.assign(t, e.value);
            }
          });
        let u = r;
        for (const t of e) {
          let e = n(t, u, i(t));
          if (!e.success) return e;
          u = e.value;
        }
        return success(u);
      },
      f: e => t[e]().allFields,
    },
    {
      intersectees: e,
      show(t) {
        return parenthesize(`${e.map(e => show(e, !0)).join(" & ")}`, t);
      },
    },
  );
}
function ParsedValue(e, t) {
  return (
    assertRuntype(e),
    create(
      "parsed",
      {
        p: (r, n, s) =>
          ((e, t, r) => {
            if (!e.success) return e;
            if (!e.cycle) {
              const n = t(e.value);
              return (
                (n.success && r && innerGuard(r, n.value, createGuardVisitedState(), !1, !0)) || n
              );
            }
            return innerMapValidationPlaceholder(
              Array.isArray(e.placeholder) ? [...e.placeholder] : { ...e.placeholder },
              () => e.unwrap(),
              t,
              r,
            );
          })(s(e, r), e => t.parse(e), t.test),
        t(r, n, s, a) {
          return t.test
            ? n(t.test, r)
            : a
            ? void 0
            : failure(`${t.name || `ParsedValue<${show(e)}>`} does not support Runtype.test`);
        },
        s(r, n, s, a, o) {
          if (!t.serialize)
            return failure(
              `${t.name || `ParsedValue<${show(e)}>`} does not support Runtype.serialize`,
            );
          const i = t.test ? innerGuard(t.test, r, createGuardVisitedState(), o, !0) : void 0;
          if (i) return i;
          const u = t.serialize(r);
          return u.success ? s(e, u.value, !1) : u;
        },
        u(r) {
          switch (r) {
            case "p":
              return e;
            case "t":
              return t.test;
            case "s":
              return t.serialize ? t.test : s;
          }
        },
      },
      {
        underlying: e,
        config: t,
        show() {
          return t.name || `ParsedValue<${show(e, !1)}>`;
        },
      },
    )
  );
}
function Literal(e) {
  return create(
    "literal",
    t =>
      t === e
        ? success(t)
        : failure(
            `Expected literal ${showValue(e)}, but was ${showValue(t)}${
              typeof t != typeof e ? ` (i.e. a ${typeof t})` : ""
            }`,
          ),
    {
      value: e,
      show() {
        return showValue(e);
      },
    },
  );
}
function hasKey(e, t) {
  return "object" == typeof t && e in t;
}
function InternalObject(e, t, r) {
  assertRuntype(...Object.values(e));
  const n = new Set(Object.keys(e)),
    s = create(
      "object",
      {
        p: (r, a, o, i, u) =>
          null == r || "object" != typeof r
            ? expected(s, r)
            : Array.isArray(r)
            ? failure(`Expected ${show(s)}, but was an Array`)
            : createValidationPlaceholder(Object.create(null), o => {
                var i;
                let l, c;
                for (const n in e)
                  if (!t || (hasKey(n, r) && void 0 !== r[n])) {
                    const i = t || hasKey(n, r) ? r[n] : void 0;
                    let f = a(e[n], i, !(!u || !u.deep) && { deep: !0 });
                    f.success
                      ? (o[n] = f.value)
                      : (l || (l = unableToAssign(r, s)),
                        l.push(typesAreNotCompatible(`"${n}"`, f)),
                        (c =
                          c ||
                          failure(f.message, { key: f.key ? `${n}.${f.key}` : n, fullError: l })));
                  }
                if (!c && u)
                  for (const e of Object.keys(r))
                    if (
                      !n.has(e) &&
                      !(null === (i = u.keysFromIntersect) || void 0 === i ? void 0 : i.has(e))
                    ) {
                      const t = `Unexpected property: ${e}`;
                      l || (l = unableToAssign(r, s)),
                        l.push([t]),
                        (c = c || failure(t, { key: e, fullError: l }));
                    }
                return c;
              }),
        f: () => n,
      },
      {
        isPartial: t,
        isReadonly: r,
        fields: e,
        asPartial: () => InternalObject(s.fields, !0, s.isReadonly),
        asReadonly: () => InternalObject(s.fields, s.isPartial, !0),
        pick(...n) {
          const s = {};
          for (const t of n) s[t] = e[t];
          return InternalObject(s, t, r);
        },
        omit(...n) {
          const s = { ...e };
          for (const e of n) e in s && delete s[e];
          return InternalObject(s, t, r);
        },
        show() {
          const n = Object.keys(e);
          return n.length
            ? `{ ${n
                .map(n => `${r ? "readonly " : ""}${n}${t ? "?" : ""}: ${show(e[n], !1)};`)
                .join(" ")} }`
            : "{}";
        },
      },
    );
  return s;
}
function Tuple(...e) {
  assertRuntype(...e);
  const t = create(
    "tuple",
    (r, n, s, a, o) =>
      Array.isArray(r)
        ? r.length !== e.length
          ? expected(`an array of length ${e.length}`, r.length)
          : createValidationPlaceholder([...r], s => {
              let a, i;
              for (let u = 0; u < e.length; u++) {
                let l = n(e[u], r[u], !(!o || !o.deep) && { deep: !0 });
                l.success
                  ? (s[u] = l.value)
                  : (a || (a = unableToAssign(r, t)),
                    a.push(typesAreNotCompatible(`[${u}]`, l)),
                    (i =
                      i ||
                      failure(l.message, {
                        key: l.key ? `[${u}].${l.key}` : `[${u}]`,
                        fullError: a,
                      })));
              }
              return i;
            })
        : expected("tuple to be an array", r),
    {
      components: e,
      isReadonly: !1,
      show() {
        return `${this.isReadonly ? "readonly " : ""}[${e.map(e => show(e, !1)).join(", ")}]`;
      },
    },
  );
  return t;
}
function isUnionType(e) {
  return "tag" in e && "union" === e.tag;
}
function mapGet(e) {
  return (t, r) => {
    const n = e.get(t);
    if (void 0 !== n) return n;
    const s = r();
    return e.set(t, s), s;
  };
}
function findFields(e, t) {
  const r = unwrapRuntype(e, t),
    n = [],
    pushField = (e, r) => {
      const s = unwrapRuntype(r, t);
      if (isUnionType(s)) for (const t of s.alternatives) pushField(e, t);
      else n.push([e, s]);
    };
  if ("tag" in (s = r) && "object" === s.tag && !r.isPartial)
    for (const e of Object.keys(r.fields)) pushField(e, r.fields[e]);
  var s;
  if (
    ((e => "tag" in e && "tuple" === e.tag)(r) &&
      r.components.forEach((e, t) => {
        pushField(`${t}`, e);
      }),
    (e => "tag" in e && "intersect" === e.tag)(r))
  )
    for (const e of r.intersectees) n.push(...findFields(e, t));
  return n;
}
function Union(...e) {
  function validateWithKey(e, t) {
    const r = `${Array.from(t.values())
      .map(e => show(e, !0))
      .join(" | ")}`;
    return (n, s) => {
      if (!n || "object" != typeof n) return expected(r, n);
      const a = t.get(n[e]);
      if (a) {
        const t = s(a, n);
        return t.success
          ? t
          : failure(t.message, {
              key: `<${/^\d+$/.test(e) ? `[${e}]` : e}: ${showValue(n[e])}>${
                t.key ? `.${t.key}` : ""
              }`,
              fullError: unableToAssign(n, r, t),
            });
      }
      {
        const s = expected(
          Array.from(t.keys())
            .map(e => ("string" == typeof e ? `'${e}'` : e))
            .join(" | "),
          n[e],
          { key: /^\d+$/.test(e) ? `[${e}]` : e },
        );
        return (
          (s.fullError = unableToAssign(
            n,
            r,
            typesAreNotCompatible(/^\d+$/.test(e) ? `[${e}]` : `"${e}"`, s.message),
          )),
          s
        );
      }
    };
  }
  function validateWithoutKey(e) {
    return (t, r) => {
      let n;
      for (const a of e) {
        const e = r(a, t);
        if (e.success) return e;
        n
          ? n.push(andError(e.fullError || unableToAssign(t, a, e)))
          : (n = unableToAssign(t, s, e.fullError || unableToAssign(t, a, e)));
      }
      return expected(s, t, { fullError: n });
    };
  }
  assertRuntype(...e);
  const t = [];
  for (const r of e) isUnionType(r) ? t.push(...r.alternatives) : t.push(r);
  const validatorOf = e => {
      const r = t.filter(t => "never" !== unwrapRuntype(t, e).tag).map(t => [t, findFields(t, e)]),
        n = r.filter(e => 0 !== e[1].length),
        s = r.filter(e => 0 === e[1].length),
        a = (e => {
          const t = (e => {
              const t = new Set(e[0]);
              for (const r of e) for (const e of t) r.has(e) || t.delete(e);
              return t;
            })(e.map(([, e]) => new Set(e.map(([e]) => e)))),
            r = new Map(["type", "kind", "tag", "version"].map(e => [e, new Map()]));
          for (const [s, a] of e)
            for (const [e, o] of a)
              if ("tag" in (n = o) && "literal" === n.tag) {
                const n = mapGet(r)(e, () => new Map());
                n.has(o.value) ? t.delete(e) : n.set(o.value, s);
              } else t.delete(e);
          var n;
          for (const [e, n] of r) if (t.has(e)) return [e, n];
        })(n);
      if (a && s.length) {
        const e = a && validateWithKey(a[0], a[1]),
          t = validateWithoutKey(s.map(e => e[0]));
        return (r, n) => {
          var s;
          const a = e(r, n);
          if (a.success) return a;
          const o = t(r, n);
          return (
            o.success ||
              o.fullError.push(
                andError(
                  null !== (s = a.fullError) && void 0 !== s ? s : unableToAssign(r, "Object"),
                ),
              ),
            o
          );
        };
      }
      return a ? validateWithKey(a[0], a[1]) : validateWithoutKey(t);
    },
    r = lazyValue(() => ({ p: validatorOf("p"), s: validatorOf("s"), t: validatorOf("t") })),
    getFieldsForMode = t => {
      const r = new Set();
      for (const n of e) {
        const e = getFields(n, t);
        if (void 0 === e) return;
        for (const t of e) r.add(t);
      }
      return r;
    },
    n = {
      p: lazyValue(() => getFieldsForMode("p")),
      t: lazyValue(() => getFieldsForMode("t")),
      s: lazyValue(() => getFieldsForMode("s")),
    },
    s = create(
      "union",
      {
        p: (e, t) => r().p(e, t),
        s: (e, t) => r().s(e, t),
        t(e, t) {
          const n = r().t(e, (e, r) => t(e, r) || success(r));
          return n.success ? void 0 : n;
        },
        f: e => n[e](),
      },
      {
        alternatives: t,
        match:
          (...t) =>
          r => {
            const n = createVisitedState();
            for (let s = 0; s < e.length; s++) {
              const a = innerValidate(e[s], r, n, !1);
              if (a.success) return t[s](a.value);
            }
            s.assert(r);
          },
        show(e) {
          return parenthesize(`${t.map(e => show(e, !0)).join(" | ")}`, e);
        },
      },
    );
  return s;
}
function InternalArr(e, t) {
  assertRuntype(e);
  const r = create(
    "array",
    (t, n, s, a, o) =>
      Array.isArray(t)
        ? createValidationPlaceholder([...t], s => {
            let a, i;
            for (let u = 0; u < t.length; u++) {
              const l = n(e, t[u], !(!o || !o.deep) && { deep: !0 });
              l.success
                ? (s[u] = l.value)
                : (a || (a = unableToAssign(t, r)),
                  a.push(typesAreNotCompatible(`[${u}]`, l)),
                  (i =
                    i ||
                    failure(l.message, {
                      key: l.key ? `[${u}].${l.key}` : `[${u}]`,
                      fullError: a,
                    })));
            }
            return i;
          })
        : expected("an Array", t),
    {
      isReadonly: t,
      element: e,
      show() {
        return `${t ? "readonly " : ""}${show(e, !0)}[]`;
      },
    },
  );
  return t || (r.asReadonly = () => InternalArr(e, !0)), r;
}
function getExpectedBaseType(e) {
  switch (e.tag) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "literal":
      return typeof e.value;
    case "union":
      const t = e.alternatives.map(getExpectedBaseType);
      return t.reduce((e, t) => (e === t ? e : "mixed"), t[0]);
    case "constraint":
      return getExpectedBaseType(e.underlying);
  }
}
function Record(e, t) {
  assertRuntype(e, t);
  const r = lazyValue(() => getExpectedBaseType(e)),
    n = create(
      "record",
      (s, a, o, i, u) =>
        null == s || "object" != typeof s
          ? expected(n, s)
          : Object.getPrototypeOf(s) !== Object.prototype && null !== Object.getPrototypeOf(s)
          ? Array.isArray(s)
            ? failure("Expected Record, but was Array")
            : failure(`Expected ${show(n)}, but was ${Object.getPrototypeOf(s)}`)
          : createValidationPlaceholder(Object.create(null), n => {
              var o;
              for (const i in s) {
                let l = null;
                if ("number" === r()) {
                  if (isNaN(+i)) return expected("record key to be a number", i);
                  l = a(e, +i, !1);
                } else
                  "string" === r()
                    ? (l = a(e, i, !1))
                    : ((l = a(e, i, !1)), l.success || isNaN(+i) || (l = a(e, +i, !1)));
                if (!l.success) return expected(`record key to be ${show(e)}`, i);
                const c = a(t, s[i], !(!u || !u.deep) && { deep: !0 });
                if (!c.success)
                  return failure(c.message, {
                    key: c.key ? `${i}.${c.key}` : i,
                    fullError: typesAreNotCompatible(
                      i,
                      null !== (o = c.fullError) && void 0 !== o ? o : [c.message],
                    ),
                  });
                n[l.value] = c.value;
              }
            }),
      {
        key: e,
        value: t,
        isReadonly: !1,
        show() {
          return `{ [_: ${show(e, !1)}]: ${show(t, !1)} }`;
        },
      },
    );
  return n;
}
function createPrimative(e) {
  return create(
    e,
    t =>
      typeof t === e
        ? success(t)
        : failure(
            `Expected ${e}, but was ${(e =>
              `${showValue(e)}${"string" == typeof e ? " (i.e. a string literal)" : ""}`)(t)}`,
          ),
    {},
  );
}
const parenthesize = (e, t) => (t ? `(${e})` : e),
  e = new Set(),
  show = (t, r = !1) => {
    if (e.has(t) && "lazy" !== t.tag) return parenthesize(`CIRCULAR ${t.tag}`, r);
    if (t.show) {
      e.add(t);
      try {
        return t.show(r);
      } finally {
        e.delete(t);
      }
    }
    return t.tag;
  };
class ValidationError extends Error {
  constructor(e) {
    super(showError(e)),
      (this.name = "ValidationError"),
      (this.shortMessage = e.message),
      (this.key = e.key),
      (this.fullError = e.fullError);
  }
}
let t;
const r = "__internal_runtype_methods__",
  n = create("unknown", e => success(e), {}),
  s = create("never", { p: e => expected("nothing", e), f: () => new Set() }, {}),
  a = Literal(void 0),
  o = Literal(null),
  i = createPrimative("boolean"),
  u = createPrimative("function"),
  l = createPrimative("number"),
  c = createPrimative("string"),
  f = createPrimative("symbol");
provideHelpers({ Union, Intersect, Constraint, Brand, ParsedValue }),
  (exports.Arr = e => InternalArr(e, !1)),
  (exports.AsyncContract = (e, t) => ({
    enforce:
      r =>
      (...n) => {
        if (n.length < e.length)
          return Promise.reject(
            new ValidationError({
              message: `Expected ${e.length} arguments but only received ${n.length}`,
            }),
          );
        const s = createVisitedState();
        for (let t = 0; t < e.length; t++) {
          const r = innerValidate(e[t], n[t], s, !1);
          if (!r.success) return Promise.reject(new ValidationError(r));
          n[t] = r.value;
        }
        const a = r(...n);
        return a instanceof Promise
          ? a.then(e => {
              const r = innerGuard(t, e, createGuardVisitedState(), !1, !1);
              if (r) throw new ValidationError(r);
              return e;
            })
          : Promise.reject(
              new ValidationError({
                message: `Expected function to return a promise, but instead got ${a}`,
              }),
            );
      },
  })),
  (exports.Boolean = i),
  (exports.Brand = Brand),
  (exports.Constraint = Constraint),
  (exports.Contract = (e, t) => ({
    enforce:
      r =>
      (...n) => {
        if (n.length < e.length)
          throw new ValidationError({
            message: `Expected ${e.length} arguments but only received ${n.length}`,
          });
        const s = createVisitedState();
        for (let t = 0; t < e.length; t++) {
          const r = innerValidate(e[t], n[t], s, !1);
          if (!r.success) throw new ValidationError(r);
          n[t] = r.value;
        }
        const a = r(...n),
          o = innerGuard(t, a, createGuardVisitedState(), !1, !1);
        if (o) throw new ValidationError(o);
        return a;
      },
  })),
  (exports.Enum = (e, t) => {
    const r = Object.values(t),
      n = new Set(r.some(e => "number" == typeof e) ? r.filter(e => "number" == typeof e) : r);
    return create("enum", t => (n.has(t) ? success(t) : expected(e, t)), {
      enumObject: t,
      show: () => e,
    });
  }),
  (exports.Function = u),
  (exports.Guard = (e, t) => n.withGuard(e, t)),
  (exports.InstanceOf = e =>
    create("instanceof", t => (t instanceof e ? success(t) : expected(`${e.name}`, t)), {
      ctor: e,
      show() {
        return `InstanceOf<${e.name}>`;
      },
    })),
  (exports.Intersect = Intersect),
  (exports.KeyOf = e => {
    const t = new Set(Object.keys(e)),
      r = [...t]
        .sort()
        .map(e => showValue(e))
        .join(" | ");
    return create(
      "keyOf",
      e => (t.has("number" == typeof e ? e.toString() : e) ? success(e) : expected(r, e)),
      { keys: t, show: e => parenthesize(r, e) },
    );
  }),
  (exports.Lazy = e => {
    const t = lazyValue(e);
    return create(
      "lazy",
      { p: (e, r, n) => n(t(), e), u: t },
      {
        underlying: t,
        show(e) {
          return show(t(), e);
        },
      },
    );
  }),
  (exports.Literal = Literal),
  (exports.Mutable = function Mutable(e) {
    const t = { ...e };
    t.isReadonly = !1;
    for (const r of ["asPartial", "pick", "omit"])
      "function" == typeof e[r] && (t[r] = (...t) => Mutable(e[r](...t)));
    return t;
  }),
  (exports.Named = (e, t) => {
    assertRuntype(t);
    const r = create(
      "named",
      { p: (e, r, n) => n(t, e), u: () => t },
      {
        underlying: t,
        name: e,
        show() {
          return e;
        },
      },
    );
    return r;
  }),
  (exports.Never = s),
  (exports.Null = o),
  (exports.Number = l),
  (exports.Obj = e => InternalObject(e, !1, !1)),
  (exports.ParsedValue = ParsedValue),
  (exports.Partial = e => InternalObject(e, !0, !1)),
  (exports.Readonly = function Readonly(e) {
    const t = { ...e };
    t.isReadonly = !0;
    for (const r of ["asPartial", "pick", "omit"])
      "function" == typeof e[r] && (t[r] = (...t) => Readonly(e[r](...t)));
    return t;
  }),
  (exports.ReadonlyArray = e => InternalArr(e, !0)),
  (exports.ReadonlyObject = e => InternalObject(e, !1, !0)),
  (exports.ReadonlyPartial = e => InternalObject(e, !0, !0)),
  (exports.ReadonlyRecord = (e, t) => {
    const r = Record(e, t);
    return (r.isReadonly = !0), r;
  }),
  (exports.ReadonlyTuple = (...e) => {
    const t = Tuple(...e);
    return (t.isReadonly = !0), t;
  }),
  (exports.Record = Record),
  (exports.Sealed = (e, { deep: t = !1 } = {}) => (
    assertRuntype(e),
    create(
      "sealed",
      { p: (r, n, s) => s(e, r, { deep: t }), u: () => e },
      { underlying: e, deep: t, show: () => `Sealed<${show(e, !1)}>` },
    )
  )),
  (exports.String = c),
  (exports.Sym = f),
  (exports.Tuple = Tuple),
  (exports.Undefined = a),
  (exports.Union = Union),
  (exports.Unknown = n),
  (exports.ValidationError = ValidationError),
  (exports.assertType = (e, t) => {
    e.assert(t);
  }),
  (exports.provideHelpers = provideHelpers),
  (exports.show = show),
  (exports.showError = showError),
  (exports.showValue = showValue);
