// ============================================================
//  Randomizer.jsx  |  After Effects 2025+
//  Assigns random values to transform properties of selected layers
//  Full 3D support: Z Position, X / Y / Z Rotation
//  UI dynamically adapts to available panel space
//  Made by festverse
// ============================================================

(function Randomizer(thisObj) {

    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "Randomizer", undefined, { resizeable: true });

        win.orientation   = "column";
        win.alignChildren = ["fill", "fill"];
        win.spacing       = 0;
        win.margins       = 0;

        // ── Root container fills all available space ──────────
        var root = win.add("group");
        root.orientation   = "column";
        root.alignChildren = ["fill", "top"];
        root.alignment     = ["fill", "fill"];
        root.spacing       = 0;
        root.margins       = [12, 10, 12, 10];

        // ── Header ────────────────────────────────────────────
        var header = root.add("group");
        header.orientation   = "row";
        header.alignChildren = ["center", "center"];
        header.alignment     = ["fill", "top"];
        header.margins       = [0, 4, 0, 6];

        var titleTxt = header.add("statictext", undefined, "RANDOMIZER");
        titleTxt.graphics.font = ScriptUI.newFont("dialog", "bold", 15);
        titleTxt.alignment     = ["center", "center"];

        // ── Divider helper ────────────────────────────────────
        function addDivider(parent) {
            var d = parent.add("panel");
            d.alignment            = ["fill", "top"];
            d.preferredSize.height = 2;
            d.margins              = [0, 4, 0, 4];
        }

        addDivider(root);

        // ── Labeled row helper ────────────────────────────────
        function addRow(parent, labelText, topMargin, bottomMargin) {
            var g = parent.add("group");
            g.orientation   = "row";
            g.alignChildren = ["left", "center"];
            g.alignment     = ["fill", "top"];
            g.margins       = [0, topMargin || 4, 0, bottomMargin || 4];
            var lbl = g.add("statictext", undefined, labelText);
            lbl.preferredSize.width = 56;
            lbl.alignment           = ["left", "center"];
            return g;
        }

        // ── Property dropdown ─────────────────────────────────
        // Position / Z Position / Scale / Rotation / X Rotation /
        // Y Rotation / Z Rotation / Opacity
        var PROPS = [
            "Position",
            "Z Position",
            "Scale",
            "Rotation",
            "X Rotation",
            "Y Rotation",
            "Z Rotation",
            "Opacity"
        ];

        var propRow = addRow(root, "Property", 6, 2);
        var propDropdown = propRow.add("dropdownlist", undefined, PROPS);
        propDropdown.selection = 0;
        propDropdown.alignment = ["fill", "center"];

        // ── Axis row (Position & Scale only) ──────────────────
        var axisRow = addRow(root, "Axis", 2, 2);
        var axisDropdown = axisRow.add("dropdownlist", undefined,
            ["X & Y (linked)", "X only", "Y only"]);
        axisDropdown.selection = 0;
        axisDropdown.alignment = ["fill", "center"];

        addDivider(root);

        // ── Min / Max ─────────────────────────────────────────
        var minRow = addRow(root, "Min", 6, 2);
        var minInput = minRow.add("edittext", undefined, "0");
        minInput.alignment  = ["fill", "center"];
        minInput.characters = 6;

        var maxRow = addRow(root, "Max", 2, 6);
        var maxInput = maxRow.add("edittext", undefined, "100");
        maxInput.alignment  = ["fill", "center"];
        maxInput.characters = 6;

        addDivider(root);

        // ── 3D-only notice (shown when a 3D prop is selected
        //    but the layer is not a 3D layer — handled at runtime,
        //    this label is just a passive hint) ─────────────────
        var hintRow = root.add("group");
        hintRow.orientation   = "row";
        hintRow.alignChildren = ["center", "center"];
        hintRow.alignment     = ["fill", "top"];
        hintRow.margins       = [0, 0, 0, 4];

        var hintTxt = hintRow.add("statictext", undefined,
            "3D properties require 3D layers.", { truncate: "end" });
        hintTxt.alignment = ["fill", "center"];
        hintTxt.justify   = "center";
        hintRow.visible   = false;   // shown dynamically

        // ── Options ───────────────────────────────────────────
        var optGroup = root.add("group");
        optGroup.orientation   = "column";
        optGroup.alignChildren = ["fill", "top"];
        optGroup.alignment     = ["fill", "top"];
        optGroup.spacing       = 6;
        optGroup.margins       = [0, 8, 0, 8];

        var addKeyCheck = optGroup.add("checkbox", undefined,
            "Add keyframe at current time");
        addKeyCheck.alignment = ["fill", "top"];
        addKeyCheck.value     = false;

        var relativeCheck = optGroup.add("checkbox", undefined,
            "Relative (offset current value)");
        relativeCheck.alignment = ["fill", "top"];
        relativeCheck.value     = false;

        addDivider(root);

        // ── Button wrapper — grows to fill remaining space ─────
        var btnWrapper = root.add("group");
        btnWrapper.orientation   = "column";
        btnWrapper.alignChildren = ["fill", "fill"];
        btnWrapper.alignment     = ["fill", "fill"];
        btnWrapper.margins       = [0, 8, 0, 8];

        var btn = btnWrapper.add("button", undefined, "RANDOMIZE");
        btn.alignment          = ["fill", "fill"];
        btn.minimumSize.height = 26;

        // ── Status bar ────────────────────────────────────────
        var statusBar = root.add("group");
        statusBar.orientation   = "row";
        statusBar.alignChildren = ["fill", "center"];
        statusBar.alignment     = ["fill", "bottom"];
        statusBar.margins       = [0, 2, 0, 0];

        var statusTxt = statusBar.add("statictext", undefined,
            "Select layers and click Randomize.", { truncate: "end" });
        statusTxt.alignment = ["fill", "center"];
        statusTxt.justify   = "left";

        // ── Properties that only exist on 3D layers ───────────
        var THREED_PROPS = {
            "Z Position" : true,
            "X Rotation" : true,
            "Y Rotation" : true,
            "Z Rotation" : true
        };

        // Properties that expose the Axis dropdown
        var HAS_AXIS = {
            "Position" : true,
            "Scale"    : true
        };

        // ── Update UI on property change ──────────────────────
        function updateUI() {
            var sel = propDropdown.selection ? propDropdown.selection.text : "";
            axisRow.visible  = !!HAS_AXIS[sel];
            hintRow.visible  = !!THREED_PROPS[sel];
            win.layout.layout(true);
            win.layout.resize();
        }
        propDropdown.onChange = updateUI;
        updateUI();

        // ── Resize handler ────────────────────────────────────
        win.onResize = win.onResizing = function () {
            this.layout.resize();
        };

        // ── Random helper ─────────────────────────────────────
        function randInRange(lo, hi) {
            return lo + Math.random() * (hi - lo);
        }

        // ── Core logic ────────────────────────────────────────
        function doRandomize() {
            var comp = app.project.activeItem;
            if (!(comp instanceof CompItem)) {
                statusTxt.text = "\u2716  No active composition.";
                return;
            }
            var layers = comp.selectedLayers;
            if (layers.length === 0) {
                statusTxt.text = "\u2716  No layers selected.";
                return;
            }
            var lo = parseFloat(minInput.text);
            var hi = parseFloat(maxInput.text);
            if (isNaN(lo) || isNaN(hi)) {
                statusTxt.text = "\u2716  Min/Max must be numbers.";
                return;
            }
            if (lo > hi) { var tmp = lo; lo = hi; hi = tmp; }

            var propName   = propDropdown.selection.text;
            var axisChoice = axisDropdown.selection
                ? axisDropdown.selection.text : "X & Y (linked)";
            var addKey     = addKeyCheck.value;
            var isRelative = relativeCheck.value;
            var curTime    = comp.time;

            app.beginUndoGroup("Randomizer \u2013 " + propName);
            var count   = 0;
            var skipped = 0;

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                var xform = layer.transform;
                var is3D  = layer.threeDLayer;

                // 3D-only properties: skip non-3D layers gracefully
                if (THREED_PROPS[propName] && !is3D) {
                    skipped++;
                    continue;
                }

                try {
                    // ── Position (X / Y, and optionally Z via axis) ──
                    if (propName === "Position") {
                        var prop = xform.position;
                        var cur  = prop.value;
                        var newX = isRelative ? cur[0] + randInRange(lo, hi) : randInRange(lo, hi);
                        var newY = isRelative ? cur[1] + randInRange(lo, hi) : randInRange(lo, hi);
                        var newZ = is3D ? cur[2] : 0; // Z untouched here; use "Z Position" for Z

                        if (axisChoice === "X only") { newY = cur[1]; }
                        if (axisChoice === "Y only") { newX = cur[0]; }

                        var newVal = is3D ? [newX, newY, newZ] : [newX, newY];
                        if (addKey) prop.setValueAtTime(curTime, newVal);
                        else        prop.setValue(newVal);

                    // ── Z Position (3D only) ─────────────────────────
                    } else if (propName === "Z Position") {
                        var prop = xform.position;
                        var cur  = prop.value; // [x, y, z]
                        var newZ = isRelative ? cur[2] + randInRange(lo, hi) : randInRange(lo, hi);
                        var newVal = [cur[0], cur[1], newZ];
                        if (addKey) prop.setValueAtTime(curTime, newVal);
                        else        prop.setValue(newVal);

                    // ── Scale ────────────────────────────────────────
                    } else if (propName === "Scale") {
                        var prop = xform.scale;
                        var cur  = prop.value;
                        var newSX, newSY;

                        if (axisChoice === "X & Y (linked)") {
                            var linked = randInRange(lo, hi);
                            newSX = isRelative ? cur[0] + linked : linked;
                            newSY = isRelative ? cur[1] + linked : linked;
                        } else if (axisChoice === "X only") {
                            newSX = isRelative ? cur[0] + randInRange(lo, hi) : randInRange(lo, hi);
                            newSY = cur[1];
                        } else { // Y only
                            newSX = cur[0];
                            newSY = isRelative ? cur[1] + randInRange(lo, hi) : randInRange(lo, hi);
                        }
                        // Z scale: keep current for 3D layers (user can't control it
                        // separately through this dropdown)
                        var newScale = is3D ? [newSX, newSY, cur[2]] : [newSX, newSY];
                        if (addKey) prop.setValueAtTime(curTime, newScale);
                        else        prop.setValue(newScale);

                    // ── Rotation (2D layers → rotation; 3D → zRotation) ──
                    } else if (propName === "Rotation") {
                        var prop = is3D ? xform.zRotation : xform.rotation;
                        var cur  = prop.value;
                        var newR = isRelative ? cur + randInRange(lo, hi) : randInRange(lo, hi);
                        if (addKey) prop.setValueAtTime(curTime, newR);
                        else        prop.setValue(newR);

                    // ── X Rotation (3D only) ─────────────────────────
                    } else if (propName === "X Rotation") {
                        var prop = xform.xRotation;
                        var cur  = prop.value;
                        var newR = isRelative ? cur + randInRange(lo, hi) : randInRange(lo, hi);
                        if (addKey) prop.setValueAtTime(curTime, newR);
                        else        prop.setValue(newR);

                    // ── Y Rotation (3D only) ─────────────────────────
                    } else if (propName === "Y Rotation") {
                        var prop = xform.yRotation;
                        var cur  = prop.value;
                        var newR = isRelative ? cur + randInRange(lo, hi) : randInRange(lo, hi);
                        if (addKey) prop.setValueAtTime(curTime, newR);
                        else        prop.setValue(newR);

                    // ── Z Rotation (3D only, explicit) ───────────────
                    } else if (propName === "Z Rotation") {
                        var prop = xform.zRotation;
                        var cur  = prop.value;
                        var newR = isRelative ? cur + randInRange(lo, hi) : randInRange(lo, hi);
                        if (addKey) prop.setValueAtTime(curTime, newR);
                        else        prop.setValue(newR);

                    // ── Opacity ──────────────────────────────────────
                    } else if (propName === "Opacity") {
                        var prop = xform.opacity;
                        var cur  = prop.value;
                        var lo2  = Math.max(0, lo);
                        var hi2  = Math.min(100, hi);
                        if (lo2 > hi2) { lo2 = 0; hi2 = 100; }
                        var rv   = randInRange(lo2, hi2);
                        var newO = isRelative
                            ? Math.min(100, Math.max(0, cur + rv)) : rv;
                        if (addKey) prop.setValueAtTime(curTime, newO);
                        else        prop.setValue(newO);
                    }

                    count++;
                } catch (e) { skipped++; }
            }

            app.endUndoGroup();

            if (count === 0) {
                statusTxt.text = skipped > 0
                    ? "\u26A0  No 3D layers selected for " + propName + "."
                    : "\u2716  Could not apply to any layer.";
            } else {
                var msg = "\u2714  " + propName + " on " + count + " layer(s).";
                if (skipped > 0) msg += " (" + skipped + " skipped)";
                statusTxt.text = msg;
            }
        }

        btn.onClick = doRandomize;
        minInput.addEventListener("keydown", function (k) {
            if (k.keyName === "Enter") doRandomize();
        });
        maxInput.addEventListener("keydown", function (k) {
            if (k.keyName === "Enter") doRandomize();
        });

        // ── Initial layout ────────────────────────────────────
        if (win instanceof Window) {
            win.layout.layout(true);
            win.center();
            win.show();
        } else {
            win.layout.layout(true);
            win.layout.resize();
        }

        return win;
    }

    buildUI(thisObj);

}(this));
