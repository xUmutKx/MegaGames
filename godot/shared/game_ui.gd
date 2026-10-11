extends RefCounted

static func add_nav(parent: Node) -> void:
	var menu := Button.new()
	menu.text = "Menu"
	menu.custom_minimum_size = Vector2(130, 60)
	menu.position = Vector2(16, 16)
	menu.pressed.connect(func(): parent.get_tree().change_scene_to_file("res://menu/menu.tscn"))
	parent.add_child(menu)
	var again := Button.new()
	again.text = "Restart"
	again.custom_minimum_size = Vector2(130, 60)
	again.anchor_left = 1.0
	again.anchor_right = 1.0
	again.offset_left = -146
	again.offset_right = -16
	again.offset_top = 16
	again.offset_bottom = 76
	again.pressed.connect(func(): parent.get_tree().reload_current_scene())
	parent.add_child(again)

static func slider(parent: Node, text: String, lo: float, hi: float, v: float) -> HSlider:
	var l := Label.new()
	l.text = text
	parent.add_child(l)
	var s := HSlider.new()
	s.min_value = lo
	s.max_value = hi
	s.step = (hi - lo) / 200.0
	s.value = v
	s.custom_minimum_size = Vector2(0, 40)
	parent.add_child(s)
	return s

static func bottom_panel(layer: CanvasLayer, top: float) -> VBoxContainer:
	var box := VBoxContainer.new()
	box.anchor_left = 0.0
	box.anchor_right = 1.0
	box.anchor_top = top
	box.anchor_bottom = 1.0
	box.offset_left = 30
	box.offset_right = -30
	box.offset_bottom = -30
	box.add_theme_constant_override("separation", 8)
	layer.add_child(box)
	return box
